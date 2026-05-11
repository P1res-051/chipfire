import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ListConversationsQuery } from './dto/list-conversations.query'
import { UpdateConversationDto } from './dto/update-conversation.dto'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Listar conversas com controle de permissão
   */
  async listConversations(
    currentUserId: string,
    isAdmin: boolean,
    filters: ListConversationsQuery,
  ) {
    const where: any = {}

    // Se não é admin, filtrar apenas instâncias do usuário
    if (!isAdmin) {
      where.instance = {
        userId: currentUserId,
      }
    }

    // Filtros opcionais (admin pode filtrar por usuário)
    if (isAdmin && filters.userId) {
      where.instance = {
        userId: filters.userId,
      }
    }

    if (filters.instanceId) {
      where.instanceId = filters.instanceId
    }

    if (filters.phone) {
      where.contact = {
        phone: { contains: filters.phone, mode: 'insensitive' },
      }
    }

    if (filters.status) {
      where.contact = {
        ...where.contact,
        status: filters.status,
      }
    }

    if (filters.tag) {
      where.contact = {
        ...where.contact,
        tag: filters.tag,
      }
    }

    // Busca por nome ou telefone
    if (filters.search) {
      where.OR = [
        {
          contact: {
            name: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          contact: {
            phone: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ]
    }

    // Filtro de data
    if (filters.dateStart || filters.dateEnd) {
      where.lastMessageAt = {}
      if (filters.dateStart) {
        where.lastMessageAt.gte = new Date(filters.dateStart)
      }
      if (filters.dateEnd) {
        where.lastMessageAt.lte = new Date(filters.dateEnd)
      }
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              tag: true,
              status: true,
              optIn: true,
              optOutAt: true,
              userId: true,
            },
          },
          instance: {
            select: {
              id: true,
              instanceName: true,
              phoneNumber: true,
              status: true,
              userId: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              text: true,
              type: true,
              direction: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          [filters.sortBy]: filters.order,
        },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.conversation.count({ where }),
    ])

    return {
      items: conversations.map((conv) => ({
        id: conv.id,
        contactId: conv.contact.id,
        instanceId: conv.instance.id,
        contact: conv.contact,
        instance: conv.instance,
        lastMessageAt: conv.lastMessageAt,
        lastMessage: conv.messages[0] || null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      total,
      limit: filters.limit,
      offset: filters.offset,
    }
  }

  /**
   * Obter detalhe de conversa
   */
  async getConversation(conversationId: string, currentUserId: string, isAdmin: boolean) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        instance: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }

    // Validar permissão
    if (!isAdmin && conversation.instance.userId !== currentUserId) {
      throw new ForbiddenException('Acesso negado')
    }

    return conversation
  }

  /**
   * Obter mensagens da conversa
   */
  async getConversationMessages(
    conversationId: string,
    currentUserId: string,
    isAdmin: boolean,
    limit: number = 50,
    offset: number = 0,
  ) {
    // Validar permissão
    const conversation = await this.getConversation(conversationId, currentUserId, isAdmin)

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          contact: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { occurredAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ])

    return {
      items: messages,
      total,
      limit,
      offset,
      conversationId,
    }
  }

  /**
   * Atualizar conversa
   */
  async updateConversation(
    conversationId: string,
    currentUserId: string,
    isAdmin: boolean,
    dto: UpdateConversationDto,
  ) {
    // Validar permissão
    await this.getConversation(conversationId, currentUserId, isAdmin)

    // Por enquanto, não há campos editáveis em Conversation model
    // Isso é preparado para futuras extensões (tag, notes)
    // Se adicionar campos ao modelo, descomente:
    /*
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: dto,
    })
    return updated
    */

    return { message: 'Campos editáveis ainda não disponíveis' }
  }

  /**
   * Marcar contato como opt-out
   */
  async markOptOut(
    conversationId: string,
    currentUserId: string,
    isAdmin: boolean,
  ) {
    // Validar permissão e obter conversa
    const conversation = await this.getConversation(conversationId, currentUserId, isAdmin)

    // Atualizar status do contato
    const contact = await this.prisma.contact.update({
      where: { id: conversation.contactId },
      data: {
        status: 'OPTOUT',
        optOutAt: new Date(),
      },
    })

    return {
      success: true,
      contact,
      message: 'Contato marcado como opt-out',
    }
  }

  /**
   * Obter conversas por usuário (para dashboard/stats)
   */
  async getConversationStats(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { instance: { userId } }

    const [total, active, optout, unread] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.count({
        where: {
          ...where,
          contact: { status: 'ACTIVE' },
        },
      }),
      this.prisma.conversation.count({
        where: {
          ...where,
          contact: { status: 'OPTOUT' },
        },
      }),
      this.prisma.conversation.count({
        where: {
          ...where,
          messages: {
            some: {
              direction: 'INBOUND',
            },
          },
        },
      }),
    ])

    return {
      total,
      active,
      optout,
      unread,
    }
  }
}
