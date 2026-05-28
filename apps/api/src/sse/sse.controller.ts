import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sse: SseService) {}

  @UseGuards(JwtAuthGuard)
  @Get('events')
  stream(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sub = this.sse.events$.subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => sub.unsubscribe());
  }
}
