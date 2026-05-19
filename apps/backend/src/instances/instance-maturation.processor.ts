import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { InstanceMaturationService } from './instance-maturation.service'

type MaturationJob = {
  instanceId: string
  targetId?: string | null
}

@Processor('instance-maturation-queue')
export class InstanceMaturationProcessor extends WorkerHost {
  private readonly logger = new Logger(InstanceMaturationProcessor.name)

  constructor(private readonly maturationService: InstanceMaturationService) {
    super()
  }

  async process(job: Job<MaturationJob>) {
    await this.maturationService.process(job.data.instanceId, job.data.targetId)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`)
  }
}
