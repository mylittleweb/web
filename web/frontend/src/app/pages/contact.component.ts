import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<h1>Contact</h1><p>This is the contact page.</p>`,
})
export class ContactComponent {}
