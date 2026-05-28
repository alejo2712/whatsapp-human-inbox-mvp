import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConversationStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly svc: ConversationsService) {}

  @Get()
  list(@Query() query: QueryConversationsDto) {
    return this.svc.list(query.status, query.page, query.pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body('status') status: ConversationStatus) {
    return this.svc.updateStatus(id, status);
  }
}
