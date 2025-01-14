import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Resource } from '../../core/models/resource.model';
import { BuildingDisplayComponent } from '../../modules/gameplay/components/building-display/building-display.component';
import { ResourceDisplayComponent } from '../../shared/components/resource-display/resource-display.component';
import { SharedModule } from '../../shared/shared.module';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    BuildingDisplayComponent,
    ResourceDisplayComponent,
  ],
  template: `
    <div class="game-container">
      @if (resources$ | async; as resource) {
      <app-resource-display [resource]="resource"></app-resource-display>
      }
      <app-building-display></app-building-display>
    </div>
  `,
  styles: [
    `
      .game-container {
        padding: 1rem;
      }
    `,
  ],
})
export class GameComponent {
  resources$: Observable<Resource>;

  constructor(private gameService: GameService) {
    this.resources$ = this.gameService.getResources$();
  }
}
