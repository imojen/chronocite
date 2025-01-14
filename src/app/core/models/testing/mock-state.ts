import { GameState } from '../game-state.model';

export const createMockGameState = (
  partial?: Partial<GameState>
): GameState => ({
  resources: {},
  buildings: {},
  upgrades: {},
  stats: {
    totalFragmentsGenerated: 0,
    buildingsConstructed: 0,
    upgradesPurchased: 0,
    cyclesCompleted: 0,
  },
  settings: {
    isPaused: false,
    autoSaveInterval: 60000,
    tickRate: 100,
  },
  lastUpdate: Date.now(),
  totalPlayTime: 0,
  ...partial,
});
