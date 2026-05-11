import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Param,
  Body,
  Query,
} from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt.payload'
import { CreateCampaignDto, createCampaignSchema } from './dto/create-campaign.dto'
import { UpdateCampaignDto, updateCampaignSchema } from './dto/update-campaign.dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { CampaignStatus } from '@prisma/client'

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  async listCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: CampaignStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.campaignsService.listCampaigns(user.sub, true, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  }

  @Post()
  async createCampaign(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createCampaignSchema)) dto: CreateCampaignDto,
  ) {
    return this.campaignsService.createCampaign(user.sub, dto)
  }

  @Get(':id')
  async getCampaignById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.getCampaignById(id, user.sub, true)
  }

  @Patch(':id')
  async updateCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(id, user.sub, dto, true)
  }

  @Delete(':id')
  async deleteCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.deleteCampaign(id, user.sub, true)
  }

  @Post(':id/start')
  async startCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.startCampaign(id, user.sub, true)
  }

  /**
   * Dry-run/preview seguro para auditoria (sem envio real):
   * Cria MessageLog com status=PREVIEW e meta contendo renderedText + dynamicGroups.
   */
  @Post(':id/dry-run')
  async dryRunCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.dryRunCampaign(id, user.sub, true)
  }

  @Post(':id/pause')
  async pauseCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.pauseCampaign(id, user.sub, true)
  }

  @Post(':id/stop')
  async stopCampaign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.stopCampaign(id, user.sub, true)
  }

  @Get(':id/metrics')
  async getCampaignMetrics(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.getCampaignMetrics(id, user.sub, true)
  }
}
