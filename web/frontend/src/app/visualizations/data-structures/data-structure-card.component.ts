import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { DataStructure } from './data-structure.types';

@Component({
  selector: 'data-structure-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, RouterLink],
  templateUrl: './data-structure-card.component.html',
  styleUrl: './data-structure-card.component.scss',
})
export class DataStructureCardComponent {
  @Input({ required: true }) dataStructure!: DataStructure;
}
