import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { CurrentUser } from '../auth/current-user.decorator';
import { LogsService } from './logs.service';

function parseDateOrUndefined(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Get()
  listMessageLogs(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('instanceId') instanceId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
    @Query('direction') direction?: 'INBOUND' | 'OUTBOUND',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.logs.listMessageLogs(user, {
      userId,
      instanceId,
      campaignId,
      contactId,
      status,
      direction,
      from: parseDateOrUndefined(from),
      to: parseDateOrUndefined(to),
    });
  }

  @Get('audit')
  listAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.logs.listAuditLogs(user, {
      userId,
      action,
      from: parseDateOrUndefined(from),
      to: parseDateOrUndefined(to),
    });
  }
}

