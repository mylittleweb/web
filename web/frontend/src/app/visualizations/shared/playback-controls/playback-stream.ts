import { Subject } from 'rxjs';

export interface PlaybackStreamObserver<E> {
  next: (event: E) => void;
  complete: () => void;
  error?: (err: unknown) => void;
}

export type Unsubscribe = () => void;

// Owns the event channel between a producer (algorithm) and one or more
// consumers. emit() publishes the event to every observer and yields to the
// event loop via setTimeout(0), so the UI can render and playback can
// advance before the producer finishes. subscribe() returns a per-observer
// unsubscribe thunk; consumers call it on destroy. rxjs is an
// implementation detail.
export class PlaybackStream<E> {
  private readonly subject = new Subject<E>();

  async emit(event: E): Promise<void> {
    this.subject.next(event);
    return await new Promise<void>((resolve) => setTimeout(resolve));
  }

  complete(): void {
    this.subject.complete();
  }

  subscribe(observer: PlaybackStreamObserver<E>): Unsubscribe {
    const sub = this.subject.subscribe(observer);
    return () => sub.unsubscribe();
  }
}
