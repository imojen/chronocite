import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <h1>Chronocité</h1>
      <p>Bienvenue dans le jeu</p>
      <button routerLink="/game">Commencer à jouer</button>
    </div>
  `,
  styles: [
    `
      .home {
        padding: 20px;
        text-align: center;
      }

      button {
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 1.1em;
        cursor: pointer;
      }
    `,
  ],
})
export class HomeComponent {
  constructor() {
    console.log('HomeComponent initialized');
  }
}
