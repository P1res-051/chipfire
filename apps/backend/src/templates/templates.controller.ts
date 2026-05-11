import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.payload';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templates: TemplatesService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.templates.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.templates.get(user, id);
  }

  @Post()
  async create(@Req() req: any, @CurrentUser() user: JwtPayload, @Body() dto: CreateTemplateDto) {
    const tpl = await this.templates.create(user, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'TEMPLATE_CREATE',
      entity: 'MessageTemplate',
      entityId: tpl.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { name: tpl.name },
    });
    return tpl;
  }

  @Patch(':id')
  async update(@Req() req: any, @CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    const tpl = await this.templates.update(user, id, dto);
    await this.audit.log({
      userId: user.sub,
      action: 'TEMPLATE_UPDATE',
      entity: 'MessageTemplate',
      entityId: tpl.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta: dto,
    });
    return tpl;
  }

  @Delete(':id')
  async remove(@Req() req: any, @CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.audit.log({
      userId: user.sub,
      action: 'TEMPLATE_DELETE',
      entity: 'MessageTemplate',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return this.templates.remove(user, id);
  }
}

