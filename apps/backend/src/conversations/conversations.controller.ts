import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { ListConversationsQuery, listConversationsQuerySchema } from './dto/list-conversations.query'
import { UpdateConversationDto, updateConversationSchema } from './dto/update-conversation.dto'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  async listConversations(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(listConversationsQuerySchema))
    query: ListConversationsQuery,
  ) {
    return this.conversationsService.listConversations(
      user.id,
      user.role === 'ADMIN',
      query,
    )
  }

  @Get(':id')
  async getConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.conversationsService.getConversation(id, user.id, user.role === 'ADMIN')
  }

  @Get(':id/messages')
  async getConversationMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.conversationsService.getConversationMessages(
      id,
      user.id,
      user.role === 'ADMIN',
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    )
  }

  @Patch(':id')
  async updateConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConversationSchema))
    dto: UpdateConversationDto,
  ) {
    return this.conversationsService.updateConversation(
      id,
      user.id,
      user.role === 'ADMIN',
      dto,
    )
  }

  @Post(':id/stats')
  async getConversationStats(
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.getConversationStats(
      user.id,
      user.role === 'ADMIN',
    )
  }
}
