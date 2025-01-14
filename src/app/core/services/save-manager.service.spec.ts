import { TestBed } from '@angular/core/testing';
import { SaveManagerService } from './save-manager.service';
import { GameState } from '../models/game-state.model';
import { createMockGameState } from '../models/testing/mock-state';

describe('SaveManagerService', () => {
  let service: SaveManagerService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Storage', [
      'getItem',
      'setItem',
      'removeItem',
    ]);
    spyOn(window, 'localStorage').and.returnValue(spy);
    localStorageSpy = spy;

    TestBed.configureTestingModule({
      providers: [SaveManagerService],
    });
    service = TestBed.inject(SaveManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save game state to localStorage', () => {
    const mockState = createMockGameState({
      resources: { timeFragments: 100 },
    });

    service.saveGame(mockState);
    expect(localStorageSpy.setItem).toHaveBeenCalledWith(
      'chronocite_save',
      jasmine.any(String)
    );
  });

  it('should load game state from localStorage', () => {
    const mockSavedState = {
      resources: { timeFragments: 100 },
    };
    localStorageSpy.getItem.and.returnValue(JSON.stringify(mockSavedState));

    const loadedState = service.loadGame();
    expect(loadedState).toEqual(mockSavedState);
  });

  it('should handle loading when no save exists', () => {
    localStorageSpy.getItem.and.returnValue(null);
    const loadedState = service.loadGame();
    expect(loadedState).toBeNull();
  });

  it('should clear save data', () => {
    service.clearSave();
    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('chronocite_save');
  });
});
