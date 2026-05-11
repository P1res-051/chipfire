import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { CampaignsService } from './campaigns.service'
import { CampaignsController } from './campaigns.controller'
import { CampaignExecutionService } from './campaign-execution.service'
import { CampaignSenderProcessor } from './campaign-sender.processor'
import { PrismaModule } from '../prisma/prisma.module'
import { EvolutionModule } from '../evolution/evolution.module'
import { DynamicContentModule } from '../dynamic-content/dynamic-content.module'

@Module({
  imports: [
    PrismaModule,
    EvolutionModule,
    DynamicContentModule,
    BullModule.registerQueue({ name: 'campaign-execution-queue' }),
  ],
  providers: [CampaignsService, CampaignExecutionService, CampaignSenderProcessor],
  controllers: [CampaignsController],
  exports: [CampaignsService, CampaignExecutionService],
})
export class CampaignsModule {}
