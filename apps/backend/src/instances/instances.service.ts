import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InstanceStatus, UserRole } from '@prisma/client';

import { JwtPayload } from '../auth/jwt.payload';
import { EvolutionService } from '../evolution/evolution.service';
import { PrismaService } from '../prisma/prisma.service';

type NormalizedQrResponse =
  | {
      success: true;
      qrcode?: string; // sempre "data:image/png;base64,..." quando for imagem
      code?: string; // quando for pairing code/texto
      raw: any;
    }
  | {
      success: false;
      message: string;
      raw: any;
    };

function looksLikeBase64(value: string) {
  // Heurística simples: base64 costuma ser longo e só conter caracteres base64/URL-safe.
  if (!value || value.length < 80) return false;
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function normalizeQr(raw: any): NormalizedQrResponse {
  const candidates = [
    raw?.qrcode?.base64,
    raw?.qrcode,
    raw?.base64,
    raw?.data?.qrcode,
    raw?.data?.base64,
    raw?.instance?.qrcode,
    raw?.instance?.base64,
  ];

  const imageCandidate = candidates.find((v) => typeof v === 'string' && v.trim().length > 0) as
    | string
    | undefined;

  if (imageCandidate) {
    const trimmed = imageCandidate.trim();
    const qrcode = trimmed.startsWith('data:image')
      ? trimmed
      : looksLikeBase64(trimmed)
        ? `data:image/png;base64,${trimmed}`
        : undefined;

    // se não parece base64, não forçamos como imagem; pode ser apenas um texto
    if (qrcode) return { success: true, qrcode, raw };
  }

  const textCandidate =
    (typeof raw?.pairingCode === 'string' && raw.pairingCode.trim()) ||
    (typeof raw?.code === 'string' && raw.code.trim()) ||
    undefined;

  if (textCandidate) return { success: true, code: textCandidate, raw };

  const countInfo =
    typeof raw?.count === 'number' ? `count=${raw.count}` : 'sem campos esperados';
  return {
    success: false,
    message: `QR Code não disponível (${countInfo})`,
    raw,
  };
}

@Injectable()
export class InstancesService {
  private readonly logger = new Logger(InstancesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionService,
  ) {}

  async listForUser(user: JwtPayload) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.whatsAppInstance.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return this.prisma.whatsAppInstance.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdmin(filters: { userId?: string; status?: InstanceStatus } = {}) {
    return this.prisma.whatsAppInstance.findMany({
      where: {
        userId: filters.userId,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, role: true } },
      },
    });
  }

  async createForUser(userId: string, input: { instanceName: string; phoneNumber?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const existingByName = await this.prisma.whatsAppInstance.findUnique({
      where: { userId_instanceName: { userId, instanceName: input.instanceName } },
    });
    if (existingByName) {
      // Permite "retry" quando ficou em ERROR (ex.: falha anterior na Evolution)
      if (existingByName.status === InstanceStatus.ERROR) {
        try {
          await this.evolution.createInstance({
            instanceName: existingByName.instanceName,
            number: input.phoneNumber,
            qrcode: true,
          });
          return await this.prisma.whatsAppInstance.update({
            where: { id: existingByName.id },
            data: { status: InstanceStatus.WAITING_QR },
          });
        } catch (e: any) {
          throw new BadRequestException('Falha ao criar instância na Evolution API');
        }
      }

      throw new BadRequestException('Já existe uma instância com esse nome para este usuário');
    }

    const existingCount = await this.prisma.whatsAppInstance.count({ where: { userId } });
    if (existingCount >= user.instanceLimit) {
      throw new ForbiddenException('Limite de instâncias atingido para este usuário');
    }

    try {
      await this.evolution.createInstance({
        instanceName: input.instanceName,
        number: input.phoneNumber,
        qrcode: true,
      });
    } catch (e: any) {
      throw new BadRequestException('Falha ao criar instância na Evolution API');
    }

    try {
      return await this.prisma.whatsAppInstance.create({
        data: {
          userId,
          instanceName: input.instanceName,
          phoneNumber: input.phoneNumber,
          status: InstanceStatus.WAITING_QR,
        },
      });
    } catch (e: any) {
      // se criou na Evolution mas falhou no banco, tenta desfazer na Evolution para não "sujar" ambiente
      try {
        await this.evolution.deleteInstance(input.instanceName);
      } catch {
        // ignore
      }
      throw e;
    }
  }

  async adminCreateForUser(input: { userId: string; instanceName: string; phoneNumber?: string }) {
    return this.createForUser(input.userId, {
      instanceName: input.instanceName,
      phoneNumber: input.phoneNumber,
    });
  }

  async getQRCode(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    let raw = await this.evolution.getQRCode(instance.instanceName);

    // Em alguns cenários, a Evolution retorna {"count":0} enquanto a instância ainda está "close".
    // Tentar um restart e reconsultar evita o "QR nunca aparece" sem alterar outras áreas do sistema.
    if (raw?.count === 0) {
      this.logger.warn(
        `[getQRCode] instanceName=${instance.instanceName} returned count=0; trying restart then reconnect`,
      );
      try {
        await this.evolution.restartInstance(instance.instanceName);
      } catch (e) {
        this.logger.warn(
          `[getQRCode] restartInstance failed (continuing): ${
            (e as any)?.message ?? 'unknown error'
          }`,
        );
      }
      await new Promise((r) => setTimeout(r, 2000));
      raw = await this.evolution.getQRCode(instance.instanceName);
    }

    const normalized = normalizeQr(raw);

    const stored =
      normalized.success && normalized.qrcode
        ? normalized.qrcode
        : normalized.success && normalized.code
          ? normalized.code
          : null;

    this.logger.debug(
      `[getQRCode] instanceId=${instanceId} instanceName=${instance.instanceName} success=${
        normalized.success
      } stored=${stored ? 'yes' : 'no'} rawKeys=${
        raw && typeof raw === 'object' ? Object.keys(raw).join(',') : typeof raw
      }`,
    );

    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { qrCode: stored, status: InstanceStatus.WAITING_QR },
    });

    return normalized;
  }

  async getStatus(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    const state = await this.evolution.getConnectionState(instance.instanceName);
    return { instanceId, providerState: state?.instance?.state ?? 'unknown' };
  }

  async reconnect(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }
    const result = await this.evolution.restartInstance(instance.instanceName);
    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.WAITING_QR },
    });
    return result;
  }

  async disconnect(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }
    const result = await this.evolution.logoutInstance(instance.instanceName);
    await this.prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.DISCONNECTED, disconnectedAt: new Date() },
    });
    return result;
  }

  async delete(user: JwtPayload, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('Instância não encontrada');
    if (user.role !== UserRole.ADMIN && instance.userId !== user.sub) {
      throw new ForbiddenException('Acesso negado');
    }

    try {
      await this.evolution.deleteInstance(instance.instanceName);
    } catch {
      // se a instância não existir/der erro na Evolution, ainda assim removemos do banco
    }
    await this.prisma.whatsAppInstance.delete({ where: { id: instanceId } });
    return { ok: true };
  }
}
