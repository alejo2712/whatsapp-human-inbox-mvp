import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

class PageQuery {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}

@UseGuards(JwtAuthGuard)
@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get()
  list(@Param('id') id: string, @Query() query: PageQuery) {
    return this.svc.listForConversation(id, query.page, query.pageSize);
  }

  @Post()
  send(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.svc.sendReply(id, dto.body);
  }
}
