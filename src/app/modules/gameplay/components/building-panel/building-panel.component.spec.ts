import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildingPanelComponent } from './building-panel.component';
import { GameService } from '../../../../core/services/game.service';
import { BehaviorSubject } from 'rxjs';
import { BUILDINGS } from '../../../../core/data/buildings.data';
import { fail } from 'jasmine';
import { createMockGameState } from '../../../../core/models/testing/mock-state';

describe('BuildingPanelComponent', () => {
  let component: BuildingPanelComponent;
  let fixture: ComponentFixture<BuildingPanelComponent>;
  let gameService: jasmine.SpyObj<GameService>;

  beforeEach(async () => {
    const gameServiceSpy = jasmine.createSpyObj(
      'GameService',
      ['purchaseBuilding'],
      {
        gameState$: new BehaviorSubject(
          createMockGameState({
            buildings: {
              chronoExtractor: 2,
            },
            resources: {
              timeFragments: 100,
            },
          })
        ),
      }
    );

    await TestBed.configureTestingModule({
      declarations: [BuildingPanelComponent],
      providers: [{ provide: GameService, useValue: gameServiceSpy }],
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    fixture = TestBed.createComponent(BuildingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display building information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buildingItems = compiled.querySelectorAll('.building-item');

    expect(buildingItems.length).toBe(Object.keys(BUILDINGS).length);
    expect(buildingItems[0].textContent).toContain('Chrono-Extracteur');
    expect(buildingItems[0].textContent).toContain('Possédés: 2');
  });

  it('should call purchaseBuilding when button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const purchaseButton = compiled.querySelector(
      '.purchase-btn'
    ) as HTMLButtonElement;

    if (purchaseButton) {
      purchaseButton.click();
      expect(gameService.purchaseBuilding).toHaveBeenCalledWith(
        'chronoExtractor'
      );
    } else {
      fail('Purchase button not found');
    }
  });
});
