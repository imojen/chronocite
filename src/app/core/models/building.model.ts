export interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  unlockCost?: number;
  unlocked?: boolean;
  requiredBuilding?: string;
  effect?: {
    type:
      | 'tick_rate'
      | 'cost_reduction'
      | 'production_boost'
      | 'resource_multiplier';
    value: number;
    target?: string;
  };
  amount?: number;
  imageIndex: number;
  isClickable?: boolean;
  clickValue?: number;
  clickIncrease?: number;
}

export type BuildingWithAmount = Building & { amount: number };
