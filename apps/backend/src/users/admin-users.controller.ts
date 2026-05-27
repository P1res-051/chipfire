import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { AuditService } from '../audit/audit.service';
import { randomUrlToken } from '../common/random';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.getById(id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateUserDto) {
    const created = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      status: dto.status as UserStatus,
      role: dto.role as UserRole,
      instanceLimit: dto.instanceLimit,
      notes: dto.notes,
    });

    const actor = req.user as JwtPayload | undefined;
    await this.audit.log({
      userId: actor?.sub,
      action: 'ADMIN_USER_CREATE',
      entity: 'User',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { email: created.email, role: created.role, status: created.status },
    });

    return created;
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.users.update(id, {
      name: dto.name,
      status: dto.status as UserStatus | undefined,
      role: dto.role as UserRole | undefined,
      instanceLimit: dto.instanceLimit,
      notes: dto.notes,
    });

    const actor = req.user as JwtPayload | undefined;
    await this.audit.log({
      userId: actor?.sub,
      action: 'ADMIN_USER_UPDATE',
      entity: 'User',
      entityId: updated.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: dto,
    });

    return updated;
  }

  @Post(':id/reset-password')
  async resetPassword(@Req() req: any, @Param('id') id: string, @Body() body: { newPassword?: string }) {
    const newPassword = body?.newPassword ?? `Tmp@${randomUrlToken(10)}`;
    const user = await this.users.resetPassword(id, newPassword);
    const actor = req.user as JwtPayload | undefined;
    await this.audit.log({
      userId: actor?.sub,
      action: 'ADMIN_USER_RESET_PASSWORD',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { generated: !body?.newPassword },
    });
    return { user, newPassword };
  }
}
