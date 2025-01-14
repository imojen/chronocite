export interface Cycle {
  id: number;
  timeElapsed: number;
  chrononsEarned: number;
  achievements: string[];
  stats: {
    totalFragmentsGenerated: number;
    buildingsConstructed: number;
    upgradesPurchased: number;
  };
}
