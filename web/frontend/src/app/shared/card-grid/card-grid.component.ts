import { Component, Input } from '@angular/core';

@Component({
  selector: 'card-grid',
  standalone: true,
  templateUrl: './card-grid.component.html',
  styleUrl: './card-grid.component.scss',
})
export class CardGridComponent {
  @Input() title = '';
  @Input() description?: string;
}
