export type UpgradeEffectType =
  | 'building_multiplier'
  | 'base_production'
  | 'building_cost'
  | 'global_multiplier'
  | 'tick_rate'
  | 'cost_reduction'
  | 'production_boost'
  | 'resource_multiplier';

export interface UpgradeEffect {
  type: UpgradeEffectType;
  target?: string;
  multiplier: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  purchased: boolean;
  requirements: {
    buildings?: { [key: string]: number };
    resources?: { [key: string]: number };
    upgrades?: { [key: string]: boolean };
  };
  effect: UpgradeEffect;
}

export type UpgradeState = { [key: string]: boolean }; // true si acheté
