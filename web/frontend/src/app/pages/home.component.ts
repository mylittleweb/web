import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<h1>Home</h1><p>This is the home page.</p>`,
})
export class HomeComponent {}
