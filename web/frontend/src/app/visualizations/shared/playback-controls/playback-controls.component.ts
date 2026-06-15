import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { PlaybackController } from './playback-controller';

@Component({
  selector: 'playback-controls',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSliderModule],
  templateUrl: './playback-controls.component.html',
  styleUrl: './playback-controls.component.scss',
})
export class PlaybackControlsComponent {
  @Input({ required: true }) controller!: PlaybackController<unknown>;

  get atEnd(): boolean {
    return this.controller.complete() && this.controller.stepIndex() >= this.controller.availableSteps() - 1;
  }

  get canStepForward(): boolean {
    return this.controller.stepIndex() < this.controller.availableSteps() - 1 || !this.controller.complete();
  }

  onSpeedInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(value)) return;
    this.controller.setSpeed(value);
  }
}
