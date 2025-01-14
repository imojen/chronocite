import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourcePanelComponent } from './resource-panel.component';
import { GameService } from '../../../core/services/game.service';
import { BehaviorSubject } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { createMockGameState } from '../../../core/models/testing/mock-state';

describe('ResourcePanelComponent', () => {
  let component: ResourcePanelComponent;
  let fixture: ComponentFixture<ResourcePanelComponent>;
  let gameService: jasmine.SpyObj<GameService>;

  beforeEach(async () => {
    const gameServiceSpy = jasmine.createSpyObj('GameService', [], {
      gameState$: new BehaviorSubject(
        createMockGameState({
          resources: {
            timeFragments: 100,
            chronons: 5,
          },
        })
      ),
    });

    await TestBed.configureTestingModule({
      declarations: [ResourcePanelComponent],
      providers: [
        { provide: GameService, useValue: gameServiceSpy },
        DecimalPipe,
      ],
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    fixture = TestBed.createComponent(ResourcePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display resources with correct formatting', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const resourceItems = compiled.querySelectorAll('.resource-item');

    expect(resourceItems.length).toBe(2);
    expect(resourceItems[0].textContent).toContain('Fragments de Temps');
    expect(resourceItems[0].textContent).toContain('100.00');
  });

  it('should not display rate when production is zero', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const rateElements = compiled.querySelectorAll('.resource-rate');

    expect(rateElements.length).toBe(0);
  });

  it('should update when resources change', () => {
    const newState = createMockGameState({
      resources: {
        timeFragments: 200,
        chronons: 10,
      },
    });

    (gameService.gameState$ as BehaviorSubject<any>).next(newState);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const resourceItems = compiled.querySelectorAll('.resource-item');
    expect(resourceItems[0].textContent).toContain('200.00');
  });
});
