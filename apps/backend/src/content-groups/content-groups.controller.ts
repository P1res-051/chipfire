import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Express } from 'express';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { ContentGroupsService } from './content-groups.service';
import { CreateContentGroupDto } from './dto/create-content-group.dto';
import { UpdateContentGroupDto } from './dto/update-content-group.dto';
import { CreateContentGroupItemDto } from './dto/create-content-group-item.dto';
import { UpdateContentGroupItemDto } from './dto/update-content-group-item.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('content-groups')
export class ContentGroupsController {
  constructor(
    private readonly contentGroups: ContentGroupsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.contentGroups.list(user);
  }

  @Post()
  async create(@Req() req: any, @CurrentUser() user: JwtPayload, @Body() dto: CreateContentGroupDto) {
    const created = await this.contentGroups.create(user, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_CREATE',
      entity: 'ContentGroup',
      entityId: created.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { name: created.name, slug: created.slug, type: created.type, selectionMode: created.selectionMode },
    });
    return created;
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.contentGroups.get(user, id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContentGroupDto,
  ) {
    const updated = await this.contentGroups.update(user, id, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_UPDATE',
      entity: 'ContentGroup',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: dto,
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: any, @CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const res = await this.contentGroups.remove(user, id);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_DELETE',
      entity: 'ContentGroup',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res;
  }

  @Get(':id/items')
  listItems(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.contentGroups.listItems(user, id);
  }

  @Post(':id/items')
  async createItem(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateContentGroupItemDto,
  ) {
    const created = await this.contentGroups.createItem(user, id, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_ITEM_CREATE',
      entity: 'ContentGroupItem',
      entityId: (created as any)?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { groupId: id, ...dto, ignored: (created as any)?.ignored ?? false },
    });
    return created;
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateContentGroupItemDto,
  ) {
    const updated = await this.contentGroups.updateItem(user, id, itemId, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_ITEM_UPDATE',
      entity: 'ContentGroupItem',
      entityId: itemId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { groupId: id, ...dto },
    });
    return updated;
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const res = await this.contentGroups.removeItem(user, id, itemId);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_ITEM_DELETE',
      entity: 'ContentGroupItem',
      entityId: itemId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { groupId: id },
    });
    return res;
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // ~15MB
    }),
  )
  async importXlsx(
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const report = await this.contentGroups.importXlsx(user, file);
    await this.audit.log({
      userId: user.sub,
      action: 'CONTENT_GROUP_IMPORT',
      entity: 'ContentGroup',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: {
        totalLines: report.totalLines,
        createdGroups: report.createdGroups,
        createdItems: report.createdItems,
        ignoredItems: report.ignoredItems,
        errors: report.errors,
      },
    });
    return report;
  }

  @Post(':id/test-resolve')
  testResolve(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Query('dryRun') dryRun?: string) {
    // dryRun padrão é true (preview não altera stats)
    // Se passar ?dryRun=false, incrementa stats (para uso real, não preview)
    const isDryRun = dryRun !== 'false';
    return this.contentGroups.testResolve(user, id, isDryRun);
  }
}
