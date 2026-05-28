import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../sse/sse.service';
import { MessageDirection, MessageStatus } from '@prisma/client';

interface WaMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  profile?: { name: string };
}

interface WaStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  async handlePayload(body: unknown) {
    const payload = body as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: WaMessage[];
            statuses?: WaStatus[];
            contacts?: Array<{ wa_id: string; profile: { name: string } }>;
          };
        }>;
      }>;
    };

    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        const contactProfiles = new Map<string, string>();
        for (const c of value.contacts ?? []) {
          contactProfiles.set(c.wa_id, c.profile.name);
        }

        for (const msg of value.messages ?? []) {
          await this.handleInboundMessage(msg, contactProfiles);
        }

        for (const status of value.statuses ?? []) {
          await this.handleStatusUpdate(status);
        }
      }
    }
  }

  private async handleInboundMessage(msg: WaMessage, profiles: Map<string, string>) {
    const phone = msg.from.startsWith('+') ? msg.from : `+${msg.from}`;
    const name = profiles.get(msg.from) ?? null;
    const body = msg.text?.body ?? `[${msg.type}]`;

    const contact = await this.prisma.contact.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: { phone, name },
    });

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, status: 'OPEN' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { contactId: contact.id },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: MessageDirection.INBOUND,
        body,
        waMessageId: msg.id,
        status: MessageStatus.DELIVERED,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    this.sse.broadcast({ type: 'new_message', conversationId: conversation.id, message });
    this.logger.log(`Inbound message from ${phone}: ${body.substring(0, 50)}`);
  }

  private async handleStatusUpdate(status: WaStatus) {
    const message = await this.prisma.message.findUnique({
      where: { waMessageId: status.id },
    });
    if (!message) return;

    const newStatus = this.mapStatus(status.status);

    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: newStatus },
    });

    await this.prisma.messageStatusEvent.create({
      data: {
        messageId: message.id,
        status: newStatus,
        timestamp: new Date(parseInt(status.timestamp, 10) * 1000),
        raw: status as unknown as object,
      },
    });
  }

  private mapStatus(status: string): MessageStatus {
    const map: Record<string, MessageStatus> = {
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      read: MessageStatus.READ,
      failed: MessageStatus.FAILED,
    };
    return map[status] ?? MessageStatus.SENT;
  }
}
