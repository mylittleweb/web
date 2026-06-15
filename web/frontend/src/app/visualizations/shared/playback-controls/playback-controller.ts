import { computed, signal } from '@angular/core';
import { PlaybackStream } from './playback-stream';

export interface PlaybackControllerOptions {
  baseStepIntervalMs?: number;
  initialSpeed?: number;
}

const DEFAULT_BASE_STEP_INTERVAL_MS = 700;

// Subscribes to a PlaybackStream and drives the playback timeline. Records
// every event into the history signal and exposes a step cursor + auto-play
// timer so the UI can replay at human speed. UI-agnostic: consumers call
// destroy() when they're done.
export class PlaybackController<E> {
  readonly history = signal<E[]>([]);
  readonly complete = signal(false);

  readonly stepIndex = signal(0);
  readonly playing = signal(false);
  readonly speed = signal(1);

  readonly availableSteps = computed(() => this.history().length);
  readonly currentEvent = computed(() => this.history()[this.stepIndex()]);

  private readonly baseInterval: number;
  private readonly unsubscribeStream: () => void;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(stream: PlaybackStream<E>, options: PlaybackControllerOptions = {}) {
    this.baseInterval = options.baseStepIntervalMs ?? DEFAULT_BASE_STEP_INTERVAL_MS;
    if (options.initialSpeed) this.speed.set(options.initialSpeed);

    this.unsubscribeStream = stream.subscribe({
      next: (event) => this.history.update((h) => [...h, event]),
      complete: () => this.complete.set(true),
      error: (err) => {
        console.error('Playback source errored', err);
        this.complete.set(true);
      },
    });
  }

  destroy(): void {
    this.unsubscribeStream();
    this.clearTimer();
  }

  stepForward = (): void => {
    const next = this.stepIndex() + 1;
    if (next < this.availableSteps()) {
      this.stepIndex.set(next);
    } else if (this.complete()) {
      this.setPlaying(false);
    }
  };

  stepBackward = (): void => {
    const prev = this.stepIndex() - 1;
    if (prev >= 0) {
      this.stepIndex.set(prev);
      this.setPlaying(false);
    }
  };

  togglePlay = (): void => {
    if (this.complete() && this.stepIndex() >= this.availableSteps() - 1) return;
    this.setPlaying(!this.playing());
  };

  reset = (): void => {
    this.setPlaying(false);
    this.stepIndex.set(0);
  };

  setSpeed = (value: number): void => {
    this.speed.set(value);
    if (this.playing()) {
      this.clearTimer();
      this.scheduleAdvance();
    }
  };

  private setPlaying(value: boolean): void {
    if (this.playing() === value) return;
    this.playing.set(value);
    if (value) this.scheduleAdvance();
    else this.clearTimer();
  }

  private scheduleAdvance(): void {
    this.clearTimer();
    const interval = this.baseInterval / this.speed();
    this.timer = setTimeout(() => {
      this.stepForward();
      if (this.playing()) this.scheduleAdvance();
    }, interval);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
