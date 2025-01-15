export interface GameState {
  resources: {
    timeFragments: number;
    temporalKnowledge: number;
    prestigePoints: number;
    [key: string]: number;
  };
  buildings: {
    [key: string]: number;
  };
  upgrades: {
    [key: string]: boolean;
  };
  skills: {
    [key: string]: {
      unlocked: boolean;
      purchased: boolean;
    };
  };
  multipliers: {
    global: number;
    buildings: { [key: string]: number };
    costs: number;
    tickRate: number;
  };
  unlockedBuildings: {
    [key: string]: boolean;
  };
  stats: {
    upgradesPurchased: number;
    cyclesCompleted: number;
    totalTemporalKnowledge: number;
    totalPrestigePoints: number;
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
