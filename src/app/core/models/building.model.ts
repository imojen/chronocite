export interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  unlockCost?: number;
  unlocked?: boolean;
  requiredBuilding?: string;
  maxLevel?: number;
  effect?: {
    type:
      | 'tick_rate'
      | 'cost_reduction'
      | 'production_boost'
      | 'resource_multiplier'
      | 'resource_production'
      | 'cycle_reset'
      | 'time_jump';
    value?: number;
    target?: string;
    jumpDuration?: number;
    cooldown?: number;
    durationIncrease?: number;
    cooldownReduction?: number;
  };
  amount?: number;
  imageIndex: number;
  isClickable?: boolean;
  clickValue?: number;
  clickIncrease?: number;
}

export type BuildingWithAmount = Building & { amount: number };
