import { TestBed } from '@angular/core/testing';
import { ProductionCalculatorService } from './production-calculator.service';
import { GameState } from '../models/game-state.model';
import { createMockGameState } from '../models/testing/mock-state';

describe('ProductionCalculatorService', () => {
  let service: ProductionCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductionCalculatorService],
    });
    service = TestBed.inject(ProductionCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate base production correctly', () => {
    const mockState = createMockGameState();
    const delta = 1;
    const production = service.calculateResourceProduction(mockState, delta);
    expect(production['timeFragments']).toBe(1);
  });

  it('should calculate building production correctly', () => {
    const mockState = createMockGameState({
      buildings: {
        chronoExtractor: 2,
      },
    });

    const delta = 1;
    const production = service.calculateResourceProduction(mockState, delta);

    expect(production['timeFragments']).toBe(1.2);
  });

  it('should handle upgrades multipliers correctly', () => {
    const mockState = createMockGameState({
      buildings: {
        chronoExtractor: 1,
      },
      upgrades: {
        improvedExtraction: true,
      },
      resources: {},
    });

    const delta = 1;
    const production = service.calculateResourceProduction(mockState, delta);
    expect(production['timeFragments']).toBe(1.2);
  });
});
