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
    if (gameState.skills) {
      const updatedBranches = { ...SKILL_BRANCHES };
      Object.values(updatedBranches).forEach((branch) => {
        branch.skills.forEach((skill) => {
          const savedSkill = gameState.skills?.[skill.id];
          if (savedSkill) {
            skill.unlocked = savedSkill.unlocked;
            skill.purchased = savedSkill.purchased;
          }
        });
      });
      this.skillBranches.next(updatedBranches);
    }
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

    // Trouver la compétence
    for (const branch of Object.values(branches)) {
      skill = branch.skills.find((s) => s.id === skillId);
      if (skill) break;
    }

    if (!skill || skill.purchased || !skill.unlocked) return false;

    // Vérifier les points de prestige disponibles
    const gameState = this.gameService.getGameState();
    if (gameState.resources.prestigePoints < skill.cost) return false;

    // Vérifier les prérequis
    if (skill.requirements?.skills) {
      return skill.requirements.skills.every((reqSkillId) => {
        for (const branch of Object.values(branches)) {
          const reqSkill = branch.skills.find((s) => s.id === reqSkillId);
          if (reqSkill?.purchased) return true;
        }
        return false;
      });
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

    // Sauvegarder l'état
    this.skillBranches.next(updatedBranches);
    return true;
  }

  private applySkillEffects(skill: Skill): void {
    skill.effects.forEach((effect) => {
      switch (effect.type) {
        case 'production':
          if (effect.target) {
            this.gameService.addBuildingMultiplier(effect.target, effect.value);
          } else {
            this.gameService.addGlobalMultiplier(effect.value);
          }
          break;
        case 'cost':
          this.gameService.addCostMultiplier(effect.value);
          break;
        case 'tick_rate':
          this.gameService.addTickRateMultiplier(effect.value);
          break;
        case 'special':
          // Gérer les effets spéciaux au cas par cas
          break;
      }
    });
  }
}
