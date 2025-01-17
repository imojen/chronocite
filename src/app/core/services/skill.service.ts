import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Skill, SkillBranch, SkillBranchType } from '../models/skill.model';
import { SKILL_BRANCHES } from '../data/skills.data';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  private skillBranches = new BehaviorSubject<
    Record<SkillBranchType, SkillBranch>
  >(SKILL_BRANCHES);

  constructor(private gameService: GameService) {
    this.initializeSkills();
  }

  private initializeSkills(): void {
    // Charger l'état des compétences depuis le gameState
    const gameState = this.gameService.getGameState();
    const updatedBranches = { ...SKILL_BRANCHES };

    // Initialiser toutes les compétences de base
    Object.values(updatedBranches).forEach((branch) => {
      branch.skills.forEach((skill) => {
        // Les compétences de départ sont toujours débloquées
        if (skill.position.x === 0 && skill.position.y === 0) {
          skill.unlocked = true;
        } else {
          skill.unlocked = false;
        }
        skill.purchased = false;
      });
    });

    // Appliquer l'état sauvegardé
    if (gameState.skills) {
      Object.entries(gameState.skills).forEach(([skillId, savedSkill]) => {
        for (const branch of Object.values(updatedBranches)) {
          const skill = branch.skills.find((s) => s.id === skillId);
          if (skill) {
            skill.unlocked = savedSkill.unlocked;
            skill.purchased = savedSkill.purchased;

            // Si la compétence est achetée, débloquer les suivantes
            if (skill.purchased) {
              branch.skills.forEach((s) => {
                if (s.requirements?.skills?.includes(skillId)) {
                  s.unlocked = true;
                }
              });
            }
          }
        }
      });
    }

    this.skillBranches.next(updatedBranches);
  }

  getSkillBranches(): Observable<Record<SkillBranchType, SkillBranch>> {
    return this.skillBranches.asObservable();
  }

  getSkill(skillId: string): Observable<Skill | undefined> {
    return this.skillBranches.pipe(
      map((branches) => {
        for (const branch of Object.values(branches)) {
          const skill = branch.skills.find((s) => s.id === skillId);
          if (skill) return skill;
        }
        return undefined;
      })
    );
  }

  canPurchaseSkill(skillId: string): boolean {
    const branches = this.skillBranches.value;
    let skill: Skill | undefined;
    let branch: SkillBranch | undefined;

    // Trouver la compétence et sa branche
    for (const b of Object.values(branches)) {
      skill = b.skills.find((s) => s.id === skillId);
      if (skill) {
        branch = b;
        break;
      }
    }

    // Vérifications de base
    if (!skill || !branch) return false;
    if (skill.purchased) return false;
    if (!skill.unlocked) return false;

    // Vérifier les points de prestige disponibles
    const gameState = this.gameService.getGameState();
    if (gameState.resources.prestigePoints < skill.cost) return false;

    // Vérifier les prérequis
    if (skill.requirements?.skills) {
      const allPrerequisitesPurchased = skill.requirements.skills.every(
        (reqSkillId) => {
          // Chercher dans la même branche d'abord
          const prerequisiteSkill = branch?.skills.find(
            (s) => s.id === reqSkillId
          );
          if (prerequisiteSkill?.purchased) return true;

          // Si non trouvé, chercher dans les autres branches
          for (const otherBranch of Object.values(branches)) {
            if (otherBranch.id === branch?.id) continue;
            const skill = otherBranch.skills.find((s) => s.id === reqSkillId);
            if (skill?.purchased) return true;
          }
          return false;
        }
      );

      if (!allPrerequisitesPurchased) return false;
    }

    return true;
  }

  purchaseSkill(skillId: string): boolean {
    if (!this.canPurchaseSkill(skillId)) return false;

    const updatedBranches = { ...this.skillBranches.value };
    let purchasedSkill: Skill | undefined;

    // Trouver et mettre à jour la compétence
    for (const branch of Object.values(updatedBranches)) {
      const skill = branch.skills.find((s) => s.id === skillId);
      if (skill) {
        skill.purchased = true;
        purchasedSkill = skill;

        // Débloquer les compétences suivantes
        branch.skills.forEach((s) => {
          if (s.requirements?.skills?.includes(skillId)) {
            s.unlocked = true;
          }
        });
        break;
      }
    }

    if (!purchasedSkill) return false;

    // Mettre à jour les points de prestige
    this.gameService.spendPrestigePoints(purchasedSkill.cost);

    // Appliquer les effets de la compétence
    this.applySkillEffects(purchasedSkill);

    // Mettre à jour l'état des compétences dans le gameState
    const currentState = this.gameService.getGameState();
    const updatedSkills = {
      ...currentState.skills,
      [skillId]: {
        unlocked: true,
        purchased: true,
      },
    };

    // Mettre à jour le gameState avec les nouvelles compétences
    const newState = {
      ...currentState,
      skills: updatedSkills,
    };
    this.gameService.updateGameState(newState);

    // Sauvegarder l'état
    this.skillBranches.next(updatedBranches);
    this.gameService.saveGame();

    return true;
  }

  private applySkillEffects(skill: Skill): void {
    const gameState = this.gameService.getGameState();

    skill.effects.forEach((effect) => {
      switch (effect.type) {
        case 'production':
          if (effect.target) {
            // Effet sur un bâtiment spécifique
            this.gameService.addBuildingMultiplier(effect.target, effect.value);
          } else {
            // Effet global sur la production
            this.gameService.addGlobalMultiplier(effect.value);
          }
          break;

        case 'cost':
          // Effet de réduction de coût
          this.gameService.addCostMultiplier(effect.value);
          break;

        case 'tick_rate':
          // Effet sur la vitesse du jeu
          this.gameService.addTickRateMultiplier(effect.value);
          break;

        case 'special':
          // Effets spéciaux selon la compétence
          switch (skill.id) {
            case 'knowledge_mastery':
              // Augmente le gain de savoir temporel
              // Géré dans le calcul de production du temple
              break;
            case 'cycle_optimization':
              // Augmente les points de prestige gagnés
              // Géré dans le calcul des points de prestige
              break;
            case 'temporal_insight':
              // Active les indicateurs de progression
              // Géré par l'interface utilisateur
              break;
            case 'bulk_purchasing':
              // Améliore l'efficacité des achats multiples
              // Géré dans la logique d'achat
              break;
          }
          break;
      }
    });

    // Sauvegarder après l'application des effets
    this.gameService.saveGame();
  }
}
