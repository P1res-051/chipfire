import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async adminDashboard() {
    const todayStart = startOfDay(new Date());
    const from7 = subDays(todayStart, 6);

    const [totalUsers, activeUsers, totalInstances, connectedInstances, disconnectedInstances] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.whatsAppInstance.count(),
        this.prisma.whatsAppInstance.count({ where: { status: 'CONNECTED' } }),
        this.prisma.whatsAppInstance.count({ where: { status: 'DISCONNECTED' } }),
      ]);

    const [totalContacts, optOutContacts] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.contact.count({ where: { status: 'OPTOUT' } }),
    ]);

    const messagesSentToday = await this.prisma.whatsAppInstance.aggregate({
      _sum: { messagesSentToday: true },
    });
    const messagesReceivedToday = await this.prisma.whatsAppInstance.aggregate({
      _sum: { messagesReceivedToday: true },
    });

    const errorsToday = await this.prisma.messageLog.count({
      where: {
        createdAt: { gte: todayStart },
        status: { not: 'SUCCESS' },
      },
    });

    const campaignsActive = await this.prisma.campaign.count({
      where: { status: 'ACTIVE' },
    });

    const healthAverageAgg = await this.prisma.whatsAppInstance.aggregate({
      _avg: { healthScore: true },
    });
    const healthAverage = Math.round(healthAverageAgg._avg.healthScore ?? 0);

    const chartInstancesByStatus = await this.prisma.whatsAppInstance.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const chartErrorsByType = await this.prisma.messageLog.groupBy({
      by: ['errorType'],
      where: { createdAt: { gte: from7 } },
      _count: { _all: true },
    });

    // Mensagens por dia (últimos 7 dias) - usa raw SQL para date_trunc
    const chartMessagesByDay = await this.prisma.$queryRaw<
      Array<{ day: string; inbound: number; outbound: number }>
    >`
      SELECT
        to_char(date_trunc('day', m."occurredAt"), 'YYYY-MM-DD') as day,
        SUM(CASE WHEN m."direction" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,
        SUM(CASE WHEN m."direction" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound
      FROM "Message" m
      WHERE m."occurredAt" >= ${from7}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return {
      totalUsers,
      activeUsers,
      totalInstances,
      connectedInstances,
      disconnectedInstances,
      totalContacts,
      optOutContacts,
      messagesSentToday: messagesSentToday._sum.messagesSentToday ?? 0,
      messagesReceivedToday: messagesReceivedToday._sum.messagesReceivedToday ?? 0,
      errorsToday,
      campaignsActive,
      healthAverage,
      chartMessagesByDay,
      chartInstancesByStatus,
      chartErrorsByType,
    };
  }

  async userDashboard(userId: string) {
    const todayStart = startOfDay(new Date());
    const from7 = subDays(todayStart, 6);

    const myInstances = await this.prisma.whatsAppInstance.count({ where: { userId } });
    const connectedInstances = await this.prisma.whatsAppInstance.count({
      where: { userId, status: 'CONNECTED' },
    });

    const sums = await this.prisma.whatsAppInstance.aggregate({
      where: { userId },
      _sum: { messagesSentToday: true, messagesReceivedToday: true, errorCount: true, optOutCount: true },
      _avg: { healthScore: true },
    });

    const errorsToday = await this.prisma.messageLog.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
        status: { not: 'SUCCESS' },
      },
    });

    const optOutsToday = await this.prisma.contact.count({
      where: { userId, status: 'OPTOUT', optOutAt: { gte: todayStart } },
    });

    const chartMyInstancesStatus = await this.prisma.whatsAppInstance.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    const chartMessagesByDay = await this.prisma.$queryRaw<
      Array<{ day: string; inbound: number; outbound: number }>
    >`
      SELECT
        to_char(date_trunc('day', m."occurredAt"), 'YYYY-MM-DD') as day,
        SUM(CASE WHEN m."direction" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,
        SUM(CASE WHEN m."direction" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound
      FROM "Message" m
      WHERE m."occurredAt" >= ${from7} AND m."instanceId" IN (
        SELECT i."id" FROM "WhatsAppInstance" i WHERE i."userId" = ${userId}
      )
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return {
      myInstances,
      connectedInstances,
      messagesSentToday: sums._sum.messagesSentToday ?? 0,
      messagesReceivedToday: sums._sum.messagesReceivedToday ?? 0,
      errorsToday,
      optOutsToday,
      healthAverage: Math.round(sums._avg.healthScore ?? 0),
      chartMessagesByDay,
      chartMyInstancesStatus,
    };
  }
}

