import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'

import { DynamicContentModule } from '../dynamic-content/dynamic-content.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { InstancesController } from './instances.controller';
import { InstanceMaturationProcessor } from './instance-maturation.processor'
import { InstanceMaturationService } from './instance-maturation.service'
import { InstancesService } from './instances.service';

@Module({
  imports: [
    EvolutionModule,
    DynamicContentModule,
    BullModule.registerQueue({ name: 'instance-maturation-queue' }),
  ],
  controllers: [InstancesController],
  providers: [InstancesService, InstanceMaturationService, InstanceMaturationProcessor],
})
export class InstancesModule {}

