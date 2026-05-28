import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [WhatsappModule, SseModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
