import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly config: ConfigService,
  ) {}

  @Get('whatsapp')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.config.get<string>('META_WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return parseInt(challenge, 10);
    }
    throw new UnauthorizedException('Webhook verification failed');
  }

  @Post('whatsapp')
  @HttpCode(200)
  async receive(@Body() body: unknown) {
    await this.webhookService.handlePayload(body);
    return { status: 'ok' };
  }
}
