import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { Algorithm } from './algorithm.types';

@Component({
  selector: 'algorithm-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, RouterLink],
  templateUrl: './algorithm-card.component.html',
  styleUrl: './algorithm-card.component.scss',
})
export class AlgorithmCardComponent {
  @Input({ required: true }) algorithm!: Algorithm;
}
