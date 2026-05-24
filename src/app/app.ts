import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from './components/login/login';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('UISistemaDactilarInces');
  isLogedIn = false;
  isLoading = true;
  user = null;

  constructor(private auth: Auth) { }

  ngOnInit(): void {
    // this.auth.isAuthenticated();
    // this.auth.isLogedIn.subscribe({
    //   next: (boolean) => {
    //     this.isLogedIn = boolean;
    //   }
    // });
    this.auth.isLoading.subscribe({
      next: (boolean) => {
        this.isLoading = boolean;
      }
    });
    this.auth.user.subscribe({
      next: (user) => {
        this.user = user;
      }
    });
  }
}
