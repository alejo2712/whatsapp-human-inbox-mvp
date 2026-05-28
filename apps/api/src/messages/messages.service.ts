import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SseService } from '../sse/sse.service';
import { MessageDirection, MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly sse: SseService,
  ) {}

  async listForConversation(conversationId: string, page = 1, pageSize = 50) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException(`Conversation ${conversationId} not found`);

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: messages, total, page, pageSize };
  }

  async sendReply(conversationId: string, body: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });
    if (!conv) throw new NotFoundException(`Conversation ${conversationId} not found`);

    const { waMessageId } = await this.whatsapp.sendTextMessage(conv.contact.phone, body);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        body,
        waMessageId,
        status: MessageStatus.SENT,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    this.sse.broadcast({ type: 'new_message', conversationId, message });

    return message;
  }
}
