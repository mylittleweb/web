import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<h1>Services</h1><p>This is the services page.</p>`,
})
export class ServicesComponent {}
