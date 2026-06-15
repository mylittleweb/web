import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<h1>About</h1><p>This is the about page.</p>`,
})
export class AboutComponent {}
