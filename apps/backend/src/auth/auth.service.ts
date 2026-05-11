import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';

import { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signAccessToken(user: { id: string; role: UserRole }) {
    const ttl = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
    return this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: ttl },
    );
  }

  private async createRefreshSession(userId: string) {
    const ttl = this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true });
    const refreshToken = nanoid(64);
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.prisma.authSession.create({
      data: { userId, refreshTokenHash, expiresAt },
    });

    return { refreshToken, refreshTokenHash, expiresAt };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('Usuário inativo');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.signAccessToken(user);
    const { refreshToken } = await this.createRefreshSession(user.id);

    return {
      accessToken,
      refreshToken,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.authSession.findFirst({
      where: { refreshTokenHash, revokedAt: null },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Refresh token inválido');
    if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Refresh expirado');
    if (session.user.status !== UserStatus.ACTIVE) throw new ForbiddenException('Usuário inativo');

    // Rotação: revoga e cria outro
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = await this.signAccessToken(session.user);
    const newSession = await this.createRefreshSession(session.user.id);

    return {
      accessToken,
      refreshToken: newSession.refreshToken,
      role: session.user.role,
      mustChangePassword: session.user.mustChangePassword,
    };
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha atual inválida');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }
}

