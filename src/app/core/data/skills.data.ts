import { SkillBranch, SkillBranchType } from '../models/skill.model';

export const SKILL_BRANCHES: Record<SkillBranchType, SkillBranch> = {
  chronos_production: {
    id: 'chronos_production',
    name: 'Production',
    description:
      "Augmente la production et l'efficacité des ressources temporelles",
    color: '#4facfe',
    skills: [
      {
        id: 'temporal_mastery',
        name: 'Maîtrise Temporelle',
        description:
          'Maîtrisez les flux temporels pour augmenter la production globale de 25%. Cette compétence fondamentale amplifie tous les aspects de votre empire temporel, créant une résonance qui améliore chaque générateur, accélérateur et compresseur.',
        branch: 'chronos_production',
        cost: 2,
        effects: [
          {
            type: 'production',
            value: 0.25,
            description:
              '+25% de production globale pour toutes les structures',
          },
        ],
        icon: 'clock',
        position: { x: 0, y: 0 },
        unlocked: true,
        purchased: false,
      },
      {
        id: 'generator_expertise',
        name: 'Expertise des Générateurs',
        description:
          "Perfectionnez vos générateurs temporels pour doubler leur efficacité. Une maîtrise approfondie des mécanismes de génération permet d'exploiter les failles temporelles avec une précision chirurgicale, maximisant le rendement de chaque générateur.",
        branch: 'chronos_production',
        cost: 3,
        effects: [
          {
            type: 'production',
            value: 1.0,
            target: 'generator',
            description:
              '+100% de production pour les générateurs | Doublement de leur efficacité de base',
          },
        ],
        icon: 'industry',
        position: { x: 1, y: 1 },
        requirements: {
          skills: ['temporal_mastery'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'accelerator_mastery',
        name: 'Maîtrise des Accélérateurs',
        description:
          "Optimisez vos accélérateurs temporels pour doubler leur puissance. Une compréhension avancée des principes d'accélération temporelle permet de manipuler le temps lui-même, créant des poches de temps accéléré où la production s'intensifie exponentiellement.",
        branch: 'chronos_production',
        cost: 3,
        effects: [
          {
            type: 'production',
            value: 1.0,
            target: 'accelerator',
            description:
              '+100% de production pour les accélérateurs | Amélioration significative de la vitesse de production',
          },
        ],
        icon: 'bolt',
        position: { x: 2, y: 1 },
        requirements: {
          skills: ['temporal_mastery'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'quantum_efficiency',
        name: 'Efficacité Quantique',
        description:
          "Exploitez les principes de la mécanique quantique pour améliorer vos compresseurs temporels de 50%. Cette technologie de pointe permet de manipuler la structure même du temps, créant des zones de compression ultra-efficaces où les lois de la physique classique ne s'appliquent plus.",
        branch: 'chronos_production',
        cost: 5,
        effects: [
          {
            type: 'production',
            value: 0.5,
            target: 'time_compressor',
            description:
              "+50% d'efficacité pour les compresseurs | Amélioration de la compression temporelle",
          },
        ],
        icon: 'compress',
        position: { x: 3, y: 2 },
        requirements: {
          skills: ['generator_expertise', 'accelerator_mastery'],
        },
        unlocked: false,
        purchased: false,
      },
    ],
  },
  economic_management: {
    id: 'economic_management',
    name: 'Économie',
    description: 'Optimise les coûts et la gestion des ressources',
    color: '#00f2fe',
    skills: [
      {
        id: 'cost_reduction',
        name: 'Réduction des Coûts',
        description: 'Réduit le coût de tous les bâtiments de 20%',
        branch: 'economic_management',
        cost: 2,
        effects: [
          {
            type: 'cost',
            value: 0.2,
            description: '-20% sur le coût des bâtiments',
          },
        ],
        icon: 'coins',
        position: { x: 0, y: 0 },
        unlocked: true,
        purchased: false,
      },
      {
        id: 'efficient_construction',
        name: 'Construction Efficace',
        description: 'Réduit la progression des coûts de 15%',
        branch: 'economic_management',
        cost: 4,
        effects: [
          {
            type: 'special',
            value: 0.15,
            description: '-15% sur la progression des coûts',
          },
        ],
        icon: 'building',
        position: { x: 1, y: 1 },
        requirements: {
          skills: ['cost_reduction'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'bulk_purchasing',
        name: 'Achat en Masse',
        description: "L'achat multiple de bâtiments est plus efficace",
        branch: 'economic_management',
        cost: 5,
        effects: [
          {
            type: 'special',
            value: 1,
            description: "Améliore l'efficacité des achats multiples",
          },
        ],
        icon: 'shopping-cart',
        position: { x: 2, y: 1 },
        requirements: {
          skills: ['cost_reduction'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'economic_mastery',
        name: 'Maîtrise Économique',
        description:
          'Les bâtiments produisent 10% de ressources supplémentaires pour chaque niveau de réduction de coût',
        branch: 'economic_management',
        cost: 7,
        effects: [
          {
            type: 'special',
            value: 0.1,
            description: '+10% de production par niveau de réduction de coût',
          },
        ],
        icon: 'chart-line',
        position: { x: 3, y: 2 },
        requirements: {
          skills: ['efficient_construction', 'bulk_purchasing'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'endgame',
        name: 'End-game',
        description:
          'La maîtrise ultime du temps. Terminer le jeu débloque un nouveau commencement...',
        branch: 'economic_management',
        cost: 10,
        effects: [
          {
            type: 'special',
            value: 1,
            description: 'Termine le jeu et débloque un nouveau cycle',
          },
        ],
        icon: 'infinity',
        position: { x: 1, y: 3 },
        requirements: {
          skills: [
            'quantum_efficiency',
            'economic_mastery',
            'prestige_mastery',
          ],
        },
        unlocked: false,
        purchased: false,
      },
    ],
  },
  exploration: {
    id: 'exploration',
    name: 'Savoir',
    description: 'Débloque de nouvelles mécaniques et opportunités',
    color: '#ffd700',
    skills: [
      {
        id: 'knowledge_mastery',
        name: 'Maîtrise du Savoir',
        description: 'Augmente le gain de savoir temporel de 50%',
        branch: 'exploration',
        cost: 3,
        effects: [
          {
            type: 'special',
            value: 0.5,
            description: '+50% de gain de savoir temporel',
          },
        ],
        icon: 'graduation-cap',
        position: { x: 0, y: 0 },
        unlocked: true,
        purchased: false,
      },
      {
        id: 'cycle_optimization',
        name: 'Optimisation des Cycles',
        description: 'Augmente les points de prestige gagnés de 25%',
        branch: 'exploration',
        cost: 4,
        effects: [
          {
            type: 'special',
            value: 0.25,
            description: '+25% de points de prestige par cycle',
          },
        ],
        icon: 'sync',
        position: { x: 1, y: 1 },
        requirements: {
          skills: ['knowledge_mastery'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'temporal_insight',
        name: 'Vision Temporelle',
        description: 'Affiche des indicateurs de progression optimale',
        branch: 'exploration',
        cost: 3,
        effects: [
          {
            type: 'special',
            value: 1,
            description: 'Débloque des indicateurs de progression',
          },
        ],
        icon: 'chart-line',
        position: { x: 2, y: 1 },
        requirements: {
          skills: ['knowledge_mastery'],
        },
        unlocked: false,
        purchased: false,
      },
      {
        id: 'prestige_mastery',
        name: 'Maîtrise du Prestige',
        description: 'Les bonus de prestige sont 50% plus efficaces',
        branch: 'exploration',
        cost: 6,
        effects: [
          {
            type: 'special',
            value: 0.5,
            description: "+50% d'efficacité des bonus de prestige",
          },
        ],
        icon: 'crown',
        position: { x: 3, y: 2 },
        requirements: {
          skills: ['cycle_optimization', 'temporal_insight'],
        },
        unlocked: false,
        purchased: false,
      },
    ],
  },
};
