import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactStatus, UserRole } from '@prisma/client';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('status') status?: ContactStatus,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
  ) {
    return this.contacts.list(user, { userId, status, tag, q });
  }

  @Get('export.csv')
  async exportCsv(@CurrentUser() user: JwtPayload, @Query('userId') userId: string | undefined, @Res() res: Response) {
    const csv = await this.contacts.exportCsv(user, userId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contatos.csv"`);
    res.send(csv);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.contacts.get(user, id);
  }

  @Post()
  async create(@Req() req: any, @CurrentUser() user: JwtPayload, @Body() dto: CreateContactDto) {
    const ownerUserId = user.role === UserRole.ADMIN ? (req.query?.userId as string | undefined) ?? user.sub : user.sub;
    const created = await this.contacts.create(user, {
      userId: ownerUserId,
      name: dto.name,
      phone: dto.phone,
      tag: dto.tag,
      optIn: dto.optIn,
      status: dto.status as any,
    });
    await this.audit.log({
      userId: user.sub,
      action: 'CONTACT_CREATE',
      entity: 'Contact',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { ownerUserId, phone: created.phone },
    });
    return created;
  }

  @Patch(':id')
  async update(@Req() req: any, @CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    const updated = await this.contacts.update(user, id, {
      name: dto.name,
      tag: dto.tag,
      optIn: dto.optIn,
      status: dto.status as any,
    });
    await this.audit.log({
      userId: user.sub,
      action: 'CONTACT_UPDATE',
      entity: 'Contact',
      entityId: updated.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: dto,
    });
    return updated;
  }

  @Post(':id/optout')
  async optout(@Req() req: any, @CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const updated = await this.contacts.markOptOut(user, id);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTACT_OPTOUT',
      entity: 'Contact',
      entityId: updated.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return updated;
  }

  @Roles(UserRole.ADMIN)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
    @Body() body: { userId?: string; confirmOptIn?: string },
  ) {
    if (!file?.buffer) {
      throw new Error('Arquivo não recebido (campo multipart: file)');
    }
    const userId = body.userId ?? user.sub;
    const confirmOptIn = body.confirmOptIn === 'true';
    const result = await this.contacts.importExcel(user, {
      userId,
      fileBuffer: file.buffer,
      confirmOptIn,
    });

    await this.audit.log({
      userId: user.sub,
      action: 'CONTACT_IMPORT_EXCEL',
      entity: 'Contact',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { userId, ...result },
    });

    return result;
  }
}
