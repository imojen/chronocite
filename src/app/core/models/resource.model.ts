export interface Resource {
  name: string;
  amount: number;
  perTick: number;
}

export interface TimeFragment extends Resource {
  multiplier: number;
}

export interface Chronon extends Resource {
  totalEarned: number;
}
