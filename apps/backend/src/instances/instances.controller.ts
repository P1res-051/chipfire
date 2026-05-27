import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { InstanceStatus, UserRole } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { AdminCreateInstanceDto } from './dto/admin-create-instance.dto';
import { UpdateInstanceMaturationConfigDto } from './dto/update-instance-maturation-config.dto'
import { UpdateInstanceMaturationDto } from './dto/update-instance-maturation.dto'
import { InstanceMaturationService } from './instance-maturation.service'
import { InstancesService } from './instances.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instances')
export class InstancesController {
  constructor(
    private readonly instances: InstancesService,
    private readonly maturation: InstanceMaturationService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('status') status?: InstanceStatus,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.instances.listAdmin({ userId, status });
    }
    return this.instances.listForUser(user);
  }

  @Roles(UserRole.USER)
  @Post()
  async create(@Req() req: any, @CurrentUser() user: JwtPayload, @Body() dto: CreateInstanceDto) {
    const created = await this.instances.createForUser(user.sub, {
      instanceName: dto.instanceName,
      phoneNumber: dto.phoneNumber,
    });

    await this.audit.log({
      userId: user.sub,
      action: 'USER_INSTANCE_CREATE',
      entity: 'WhatsAppInstance',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { instanceName: created.instanceName },
    });
    return created;
  }

  @Roles(UserRole.ADMIN)
  @Post('admin')
  async adminCreate(@Req() req: any, @CurrentUser() actor: JwtPayload, @Body() dto: AdminCreateInstanceDto) {
    const created = await this.instances.adminCreateForUser({
      userId: dto.userId,
      instanceName: dto.instanceName,
      phoneNumber: dto.phoneNumber,
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'ADMIN_INSTANCE_CREATE',
      entity: 'WhatsAppInstance',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { userId: dto.userId, instanceName: created.instanceName },
    });
    return created;
  }

  @Get(':id/qrcode')
  getQr(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instances.getQRCode(user, id);
  }

  @Get(':id/status')
  getStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instances.getStatus(user, id);
  }

  @Put(':id/reconnect')
  reconnect(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instances.reconnect(user, id);
  }

  @Put(':id/disconnect')
  disconnect(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instances.disconnect(user, id);
  }

  @Roles(UserRole.ADMIN)
  @Put('maturation/connected/enable')
  async enableConnectedMaturation(@Req() req: any, @CurrentUser() actor: JwtPayload) {
    const result = await this.maturation.enableConnectedForAdmin(actor)

    await this.audit.log({
      userId: actor.sub,
      action: 'ADMIN_INSTANCE_MATURATION_ENABLE_CONNECTED',
      entity: 'WhatsAppInstance',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: result,
    })

    return result
  }

  @Put(':id/maturation')
  updateMaturation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInstanceMaturationDto,
  ) {
    return this.maturation.updateEnabled(user, id, dto.enabled)
  }

  @Put(':id/maturation/config')
  updateMaturationConfig(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInstanceMaturationConfigDto,
  ) {
    return this.maturation.updateConfig(user, id, dto)
  }

  @Post(':id/maturation/trigger')
  triggerMaturation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.maturation.triggerNow(user, id)
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instances.delete(user, id);
  }
}
