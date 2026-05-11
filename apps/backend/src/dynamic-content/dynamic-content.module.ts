import { Module } from '@nestjs/common'
import { DynamicContentResolverService } from './dynamic-content-resolver.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [DynamicContentResolverService],
  exports: [DynamicContentResolverService],
})
export class DynamicContentModule {}
