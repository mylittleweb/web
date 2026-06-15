import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent, NavUser } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';

  user: NavUser = {
    name: 'Hui Zheng',
    email: 'hui@example.com',
  };

  onProfileClick(): void {
    console.log('profile clicked');
  }

  onSettingsClick(): void {
    console.log('settings clicked');
  }

  onSignOut(): void {
    console.log('sign out clicked');
  }
}
