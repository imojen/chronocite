import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { SaveManagerService } from './save-manager.service';
import { GameLoopService } from './game-loop.service';
import { ProductionCalculatorService } from './production-calculator.service';
import { createMockGameState } from '../models/testing/mock-state';

describe('GameService', () => {
  let service: GameService;
  let saveManager: jasmine.SpyObj<SaveManagerService>;
  let gameLoop: jasmine.SpyObj<GameLoopService>;
  let productionCalculator: jasmine.SpyObj<ProductionCalculatorService>;

  beforeEach(() => {
    const saveSpy = jasmine.createSpyObj('SaveManagerService', [
      'loadGame',
      'saveGame',
      'startAutoSave',
      'stopAutoSave',
    ]);
    const loopSpy = jasmine.createSpyObj('GameLoopService', [
      'startGameLoop',
      'stopGameLoop',
      'togglePause',
    ]);
    const calcSpy = jasmine.createSpyObj('ProductionCalculatorService', [
      'calculateResourceProduction',
      'getBuildingConfig',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: SaveManagerService, useValue: saveSpy },
        { provide: GameLoopService, useValue: loopSpy },
        { provide: ProductionCalculatorService, useValue: calcSpy },
      ],
    });

    service = TestBed.inject(GameService);
    saveManager = TestBed.inject(
      SaveManagerService
    ) as jasmine.SpyObj<SaveManagerService>;
    gameLoop = TestBed.inject(
      GameLoopService
    ) as jasmine.SpyObj<GameLoopService>;
    productionCalculator = TestBed.inject(
      ProductionCalculatorService
    ) as jasmine.SpyObj<ProductionCalculatorService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default state if no save exists', () => {
    saveManager.loadGame.and.returnValue(null);
    service['initGame']();
    expect(service['gameState'].value.resources).toEqual({});
    expect(service['gameState'].value.buildings).toEqual({});
  });

  it('should start game loop on initialization', () => {
    expect(gameLoop.startGameLoop).toHaveBeenCalled();
  });

  it('should save game on destruction', () => {
    service.ngOnDestroy();
    expect(saveManager.saveGame).toHaveBeenCalled();
    expect(gameLoop.stopGameLoop).toHaveBeenCalled();
  });

  it('should correctly purchase buildings when resources are sufficient', () => {
    const mockBuilding = {
      id: 'chronoExtractor',
      cost: { timeFragments: 10 },
    };
    service['gameState'].next(
      createMockGameState({
        resources: { timeFragments: 20 },
      })
    );

    productionCalculator.getBuildingConfig.and.returnValue(mockBuilding);

    const result = service.purchaseBuilding('chronoExtractor');

    expect(result).toBe(true);
    expect(service['gameState'].value.resources['timeFragments']).toBe(10);
    expect(service['gameState'].value.buildings['chronoExtractor']).toBe(1);
  });

  it('should not purchase building when resources are insufficient', () => {
    const mockBuilding = {
      id: 'chronoExtractor',
      cost: { timeFragments: 100 },
    };
    service['gameState'].next(
      createMockGameState({
        resources: { timeFragments: 50 },
      })
    );

    productionCalculator.getBuildingConfig.and.returnValue(mockBuilding);

    const result = service.purchaseBuilding('chronoExtractor');

    expect(result).toBe(false);
    expect(service['gameState'].value.resources['timeFragments']).toBe(50);
    expect(
      service['gameState'].value.buildings['chronoExtractor']
    ).toBeUndefined();
  });

  it('should handle pause toggle correctly', () => {
    service.togglePause();
    expect(gameLoop.togglePause).toHaveBeenCalled();
  });
});
