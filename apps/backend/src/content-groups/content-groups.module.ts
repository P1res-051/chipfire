import { Module } from '@nestjs/common';

import { ContentGroupsController } from './content-groups.controller';
import { ContentGroupsService } from './content-groups.service';

@Module({
  controllers: [ContentGroupsController],
  providers: [ContentGroupsService],
})
export class ContentGroupsModule {}

