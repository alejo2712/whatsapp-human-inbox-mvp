import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [SseModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
