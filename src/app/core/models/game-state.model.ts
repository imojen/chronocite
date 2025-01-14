export interface GameState {
  resources: {
    timeFragments: number;
    [key: string]: number;
  };
  buildings: {
    [key: string]: number;
  };
  upgrades: {
    [key: string]: boolean;
  };
  unlockedBuildings: {
    [key: string]: boolean;
  };
  stats: {
    upgradesPurchased: number;
    [key: string]: number;
  };
  lastUpdate: number;
  totalPlayTime: number;
  totalProduction: number;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  amount?: number;
}
