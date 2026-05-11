import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { JwtPayload } from '../auth/jwt.payload';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMessageLogs(user: JwtPayload, filters: {
    userId?: string;
    instanceId?: string;
    campaignId?: string;
    contactId?: string;
    status?: string;
    direction?: 'INBOUND' | 'OUTBOUND';
    from?: Date;
    to?: Date;
  }) {
    const where: Prisma.MessageLogWhereInput = {
      userId: user.role === UserRole.ADMIN ? filters.userId : user.sub,
      instanceId: filters.instanceId,
      campaignId: filters.campaignId,
      contactId: filters.contactId,
      status: filters.status,
      direction: filters.direction as any,
      createdAt: {
        gte: filters.from,
        lte: filters.to,
      },
    };

    return this.prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        instance: { select: { id: true, instanceName: true, phoneNumber: true } },
        contact: { select: { id: true, name: true, phone: true, tag: true } },
        campaign: { select: { id: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      take: 500,
    });
  }

  async listAuditLogs(user: JwtPayload, filters: { userId?: string; action?: string; from?: Date; to?: Date }) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: user.role === UserRole.ADMIN ? filters.userId : user.sub,
        action: filters.action,
        createdAt: { gte: filters.from, lte: filters.to },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

