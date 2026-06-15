import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavService } from './nav.service';

export interface NavUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-navigation',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './navigation.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  @Input() user: NavUser | null = null;
  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();

  readonly sections;

  constructor(private readonly navService: NavService) {
    this.sections = this.navService.sections;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
