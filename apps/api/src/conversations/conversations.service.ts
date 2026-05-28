import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: ConversationStatus, page = 1, pageSize = 20) {
    const where = status ? { status } : {};
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          contact: true,
          assignedUser: { select: { id: true, name: true, email: true, role: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const data = conversations.map((c) => ({
      id: c.id,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      contact: { id: c.contact.id, phone: c.contact.phone, name: c.contact.name },
      assignedUser: c.assignedUser,
      lastMessage: c.messages[0] ?? null,
      unreadCount: 0, // TODO: track per agent in future
    }));

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);
    return conv;
  }

  async updateStatus(id: string, status: ConversationStatus) {
    const conv = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);
    return this.prisma.conversation.update({ where: { id }, data: { status } });
  }
}
