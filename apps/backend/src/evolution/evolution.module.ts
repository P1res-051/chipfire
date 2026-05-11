import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { EvolutionService } from './evolution.service';

@Module({
  imports: [HttpModule],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class EvolutionModule {}

