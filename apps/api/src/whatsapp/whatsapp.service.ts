import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(private readonly config: ConfigService) {
    const version = config.get<string>('META_GRAPH_API_VERSION') ?? 'v20.0';
    this.baseUrl = `https://graph.facebook.com/${version}`;
    this.token = config.get<string>('META_WHATSAPP_ACCESS_TOKEN') ?? '';
    this.phoneNumberId = config.get<string>('META_WHATSAPP_PHONE_NUMBER_ID') ?? '';
  }

  async sendTextMessage(to: string, body: string): Promise<{ waMessageId: string }> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const waMessageId: string = response.data?.messages?.[0]?.id ?? '';
    return { waMessageId };
  }
}
