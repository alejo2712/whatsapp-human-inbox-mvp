import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService {
  private readonly subject = new Subject<unknown>();
  readonly events$ = this.subject.asObservable();

  broadcast(event: unknown) {
    this.subject.next(event);
  }
}
