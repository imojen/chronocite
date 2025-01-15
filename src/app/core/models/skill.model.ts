export type SkillBranchType =
  | 'chronos_production'
  | 'economic_management'
  | 'exploration';

export interface SkillEffect {
  type: 'production' | 'cost' | 'tick_rate' | 'special';
  value: number;
  target?: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  branch: SkillBranchType;
  cost: number;
  effects: SkillEffect[];
  icon: string;
  position: {
    x: number;
    y: number;
  };
  requirements?: {
    skills?: string[];
    level?: number;
  };
  unlocked: boolean;
  purchased: boolean;
}

export interface SkillBranch {
  id: SkillBranchType;
  name: string;
  description: string;
  color: string;
  skills: Skill[];
}
