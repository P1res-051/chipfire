import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { CampaignExecutionService } from './campaign-execution.service'

interface CampaignMessageJob {
  campaignId: string
  contactId: string
  instanceId: string
  phoneNumber: string
  templateId: string
  mediaId?: string
  attemptNumber: number
}

@Processor('campaign-execution-queue')
export class CampaignSenderProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignSenderProcessor.name)

  constructor(private campaignExecution: CampaignExecutionService) {
    super()
  }

  async process(job: Job<CampaignMessageJob>): Promise<void> {
    this.logger.log(
      `[${job.data.campaignId}] Processando mensagem para ${job.data.phoneNumber}`,
    )

    try {
      await this.campaignExecution.processCampaignMessage(job.data)
      this.logger.log(`[${job.data.campaignId}] Mensagem processada com sucesso`)
    } catch (error) {
      this.logger.error(
        `[${job.data.campaignId}] Erro ao processar mensagem: ${error}`,
        error,
      )
      throw error // Deixar BullMQ fazer retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`,
    )
  }
}
