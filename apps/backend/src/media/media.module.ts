import { Module } from '@nestjs/common'
import { MediaService } from './media.service'
import { MediaController } from './media.controller'
import { StorageService } from './storage.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [MediaService, StorageService],
  controllers: [MediaController],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
