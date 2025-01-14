import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Jeu</h2>
      <p>Version statique</p>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1rem;
        background: white;
        border-radius: 4px;
      }
    `,
  ],
})
export class GameContainerComponent {
  constructor() {
    console.log('GameContainer initialized - Basic version');
  }
}
