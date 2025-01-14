import { Upgrade } from '../models/upgrade.model';

export const UPGRADES: { [key: string]: Upgrade } = {
  temporal_mastery: {
    id: 'temporal_mastery',
    name: 'Maîtrise Temporelle',
    description: 'Augmente la production de tous les bâtiments de 50%',
    cost: 2000,
    unlocked: false,
    purchased: false,
    effect: {
      type: 'global_multiplier',
      multiplier: 1.5,
    },
    requirements: {
      buildings: {
        generator: 10,
      },
      upgrades: {},
    },
  },
  better_generators: {
    id: 'better_generators',
    name: 'Générateurs Améliorés',
    description: 'Augmente la production des générateurs de 50%',
    cost: 100,
    unlocked: false,
    purchased: false,
    effect: {
      type: 'building_multiplier',
      target: 'generator',
      multiplier: 1.5,
    },
    requirements: {
      buildings: {
        generator: 5,
      },
      upgrades: {},
    },
  },
  efficient_base: {
    id: 'efficient_base',
    name: 'Production de Base Efficace',
    description: 'Augmente la production de base de 25%',
    cost: 200,
    unlocked: false,
    purchased: false,
    effect: {
      type: 'base_production',
      multiplier: 1.25,
    },
    requirements: {
      buildings: {
        generator: 2,
      },
      upgrades: {},
    },
  },
};
