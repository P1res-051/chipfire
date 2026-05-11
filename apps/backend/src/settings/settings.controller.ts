import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  async update(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    const updated = await this.settings.update(dto);
    const actor = req.user as JwtPayload | undefined;
    await this.audit.log({
      userId: actor?.sub,
      action: 'SETTINGS_UPDATE',
      entity: 'GlobalSettings',
      entityId: updated.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: dto,
    });
    return updated;
  }
}
