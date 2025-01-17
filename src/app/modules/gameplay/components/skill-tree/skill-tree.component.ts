import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillService } from '../../../../core/services/skill.service';
import {
  Skill,
  SkillBranch,
  SkillBranchType,
} from '../../../../core/models/skill.model';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';
import { map } from 'rxjs/operators';
import { GameService } from '../../../../core/services/game.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-skill-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="close($event)">
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-content">
            <h2>Arbre de compétences</h2>
            <div class="prestige-points">
              <i class="fas fa-star"></i>
              {{ prestigePoints$ | async | number : '1.0-0' }} points de
              prestige
            </div>
          </div>
          <button class="close-button" (click)="close($event)">×</button>
        </div>
        <div class="modal-content">
          <div class="skill-tree-container">
            @for (branch of branches$ | async; track branch.id) {
            <div class="skill-branch" [style.--branch-color]="branch.color">
              <div class="branch-header">
                <h3>{{ branch.name }}</h3>
              </div>
              <div class="skills-grid">
                @for (skill of branch.skills; track skill.id) {
                <div
                  class="skill-node"
                  [class.unlocked]="skill.unlocked"
                  [class.purchased]="skill.purchased"
                  [class.available]="isSkillAvailable(skill)"
                  [style.--node-x]="skill.position.x"
                  [style.--node-y]="skill.position.y"
                  (click)="purchaseSkill(skill.id)"
                  (mousemove)="updateTooltipPosition($event)"
                >
                  <div class="node-connections">
                    @if (hasRequirements(skill) && skill.id !== 'endgame') {
                    @for (reqId of getRequirementSkills(skill); track reqId) {
                    <div
                      class="connection-line"
                      [class.active]="isSkillPurchased(reqId)"
                    ></div>
                    } }
                  </div>
                  <div
                    class="skill-icon"
                    [class.pulse]="isSkillAvailable(skill)"
                  >
                    <i class="fas fa-{{ skill.icon }}"></i>
                  </div>
                  @if (skill.purchased) {
                  <div class="skill-check">
                    <i class="fas fa-check"></i>
                  </div>
                  }
                  <div class="skill-tooltip">
                    <div class="tooltip-header">
                      <h4>{{ skill.name }}</h4>
                      @if (!skill.purchased) {
                      <div
                        class="tooltip-cost"
                        [class.affordable]="canAffordSkill(skill)"
                      >
                        {{ skill.cost | number : '1.0-0' }} points de prestige
                      </div>
                      }
                    </div>
                    <p class="tooltip-description">{{ skill.description }}</p>
                    @if (skill.effects.length > 0) {
                    <div class="tooltip-effects">
                      @for (effect of skill.effects; track effect.type) {
                      <div class="effect">
                        {{ effect.description }}
                      </div>
                      }
                    </div>
                    } @if (hasRequirements(skill)) {
                    <div class="tooltip-requirements">
                      <h5>Prérequis :</h5>
                      <ul>
                        @for (reqId of getRequirementSkills(skill); track reqId)
                        {
                        <li [class.met]="isSkillPurchased(reqId)">
                          {{ getSkillName(reqId) }}
                        </li>
                        }
                      </ul>
                    </div>
                    }
                  </div>
                </div>
                }
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-container {
        background: rgba(13, 17, 23, 0.95);
        border-radius: 12px;
        width: 95%;
        height: 95%;
        max-width: 1500px;
        position: relative;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: visible;
      }

      .modal-header {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .header-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      h2 {
        margin: 0;
        color: #fff;
        font-size: 1.6rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .prestige-points {
        color: #ffd700;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 215, 0, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 215, 0, 0.2);
      }

      .prestige-points i {
        font-size: 1.2rem;
      }

      .close-button {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .modal-content {
        flex: 1;
        overflow: visible;
        padding: 2rem;
        background: radial-gradient(
          circle at center,
          rgba(30, 40, 50, 0.5) 0%,
          rgba(10, 15, 20, 0.5) 100%
        );
      }

      .skill-tree-container {
        display: flex;
        gap: 4rem;
        justify-content: center;
        min-height: 100%;
        padding: 2rem;
      }

      .skill-branch {
        position: relative;
        width: 300px;
      }

      .branch-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .branch-header h3 {
        color: var(--branch-color);
        font-size: 1.4rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 0 10px var(--branch-color);
      }

      .skills-grid {
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        align-items: center;
      }

      .skill-node {
        position: relative;
        width: 60px;
        height: 69px;
        margin: 0 auto;
        cursor: pointer;
        opacity: 0.5;
        transition: all 0.3s ease;
        filter: grayscale(1) brightness(0.3);
        position: relative;
        z-index: 100;
      }

      .skill-node:hover {
        z-index: 100;
      }

      .skill-node.unlocked {
        opacity: 1;
        filter: grayscale(0) brightness(1);
      }

      .skill-node.available {
        opacity: 1;
        filter: grayscale(0) brightness(1);
      }

      .skill-node.available .skill-icon {
        box-shadow: 0 0 20px var(--branch-color);
      }

      .skill-node.available .skill-icon::before {
        opacity: 0.4;
      }

      .skill-node.available .skill-icon::after {
        opacity: 0.6;
        filter: blur(3px);
      }

      .skill-node.available .skill-icon i {
        opacity: 1;
        filter: drop-shadow(0 0 12px var(--branch-color)) brightness(1.5);
        animation: glow 2s ease-in-out infinite alternate;
      }

      @keyframes glow {
        from {
          filter: drop-shadow(0 0 12px var(--branch-color)) brightness(1.5);
        }
        to {
          filter: drop-shadow(0 0 20px var(--branch-color)) brightness(2);
        }
      }

      .skill-node.available:hover .skill-icon {
        transform: translateY(-3px);
        box-shadow: 0 0 30px var(--branch-color);
      }

      .skill-node.available:hover .skill-icon::before {
        opacity: 0.6;
      }

      .skill-node.available:hover .skill-icon::after {
        opacity: 0.8;
        filter: blur(4px);
      }

      .skill-node.available:hover .skill-icon i {
        transform: scale(1.15);
        animation: glowHover 1s ease-in-out infinite alternate;
      }

      @keyframes glowHover {
        from {
          filter: drop-shadow(0 0 15px var(--branch-color)) brightness(1.8);
        }
        to {
          filter: drop-shadow(0 0 25px var(--branch-color)) brightness(2.2);
        }
      }

      .skill-node.purchased {
        opacity: 1;
        filter: grayscale(0) brightness(1.3);
      }

      .skill-node.purchased .skill-icon {
        background: rgba(0, 0, 0, 0.6);
        box-shadow: 0 0 20px var(--branch-color);
      }

      .skill-node.purchased .skill-icon::before {
        opacity: 0.4;
        animation: shimmer 3s linear infinite;
      }

      .skill-node.purchased .skill-icon::after {
        opacity: 0.5;
        filter: blur(3px);
      }

      .skill-node.purchased .skill-icon i {
        color: #fff;
        opacity: 1;
        filter: drop-shadow(0 0 6px var(--branch-color)) brightness(1.2);
      }

      .skill-node.purchased:hover .skill-icon {
        transform: translateY(-3px);
        background: rgba(0, 0, 0, 0.7);
        box-shadow: 0 0 25px var(--branch-color);
      }

      .skill-node.purchased:hover .skill-icon::before {
        opacity: 0.5;
      }

      .skill-node.purchased:hover .skill-icon::after {
        opacity: 0.6;
        filter: blur(4px);
      }

      .skill-node.purchased:hover .skill-icon i {
        transform: scale(1.15);
        filter: drop-shadow(0 0 10px var(--branch-color)) brightness(1.4);
      }

      @keyframes shimmer {
        0% {
          opacity: 0.3;
          filter: brightness(1);
        }
        50% {
          opacity: 0.6;
          filter: brightness(1.3);
        }
        100% {
          opacity: 0.3;
          filter: brightness(1);
        }
      }

      .node-connections {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 0;
      }

      .connection-line {
        position: absolute;
        width: 4px;
        height: 3rem;
        background: rgba(255, 255, 255, 0.1);
        left: 50%;
        bottom: 100%;
        transform: translateX(-50%);
        transition: all 0.3s ease;
      }

      .connection-line.active {
        background: var(--branch-color);
        box-shadow: 0 0 10px var(--branch-color);
      }

      .skill-icon {
        position: relative;
        width: 100%;
        height: 100%;
        background: rgba(10, 13, 18, 0.95);
        clip-path: polygon(
          50% 0%,
          100% 25%,
          100% 75%,
          50% 100%,
          0% 75%,
          0% 25%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1;
      }

      .skill-node:hover .skill-icon {
        transform: translateY(-2px);
      }

      .skill-icon::before {
        content: '';
        position: absolute;
        inset: 1px;
        background: linear-gradient(
          45deg,
          transparent 0%,
          var(--branch-color) 45%,
          var(--branch-color) 55%,
          transparent 100%
        );
        opacity: 0.05;
        clip-path: polygon(
          50% 0%,
          100% 25%,
          100% 75%,
          50% 100%,
          0% 75%,
          0% 25%
        );
        transition: all 0.3s ease;
      }

      .skill-node:hover .skill-icon::before {
        opacity: 0.15;
        filter: blur(2px);
      }

      .skill-icon::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          transparent,
          var(--branch-color)
        );
        opacity: 0.1;
        clip-path: polygon(
          50% 0%,
          100% 25%,
          100% 75%,
          50% 100%,
          0% 75%,
          0% 25%
        );
        filter: blur(4px);
        transition: all 0.3s ease;
      }

      .skill-node:hover .skill-icon::after {
        opacity: 0.2;
        filter: blur(3px);
      }

      .skill-node.purchased .skill-icon {
        background: rgba(0, 0, 0, 0.6);
      }

      .skill-node.purchased:hover .skill-icon {
        transform: translateY(-2px);
        background: rgba(0, 0, 0, 0.7);
      }

      .skill-node.purchased .skill-icon::before {
        opacity: 0.3;
        animation: shimmer 3s linear infinite;
      }

      .skill-node.purchased:hover .skill-icon::before {
        opacity: 0.4;
      }

      .skill-node.purchased .skill-icon::after {
        opacity: 0.4;
      }

      .skill-node.purchased:hover .skill-icon::after {
        opacity: 0.5;
        filter: blur(2px);
      }

      .skill-icon i {
        color: var(--branch-color);
        font-size: 1.5rem;
        transition: all 0.3s ease;
        z-index: 2;
        opacity: 0.8;
        filter: drop-shadow(0 0 2px var(--branch-color));
      }

      .skill-node:hover .skill-icon i {
        transform: scale(1.1);
        opacity: 1;
        filter: drop-shadow(0 0 4px var(--branch-color));
      }

      .skill-node.purchased .skill-icon i {
        color: #fff;
        opacity: 1;
        filter: drop-shadow(0 0 4px var(--branch-color));
      }

      .skill-node.purchased:hover .skill-icon i {
        transform: scale(1.1);
        filter: drop-shadow(0 0 6px var(--branch-color));
      }

      @keyframes shimmer {
        0% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.4;
        }
        100% {
          opacity: 0.2;
        }
      }

      .skill-tooltip {
        position: absolute;
        top: 50%;
        left: calc(100% + 20px);
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid var(--branch-color);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        padding: 1.5rem;
        width: 350px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1001;
        visibility: hidden;
      }

      .skill-branch:last-child .skill-node .skill-tooltip {
        left: auto;
        right: calc(100% + 20px);
      }

      .skill-node:hover .skill-tooltip {
        opacity: 1;
        visibility: visible;
      }

      .tooltip-header {
        margin-bottom: 1.5rem;
        border-bottom: 1px solid rgba(var(--branch-color), 0.3);
        padding-bottom: 1rem;
      }

      .tooltip-header h4 {
        color: var(--branch-color);
        margin: 0 0 0.75rem;
        font-size: 1.3rem;
        font-weight: 600;
        text-shadow: 0 0 10px var(--branch-color);
        letter-spacing: 1px;
      }

      .tooltip-cost {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #ff4444;
        font-size: 1rem;
        transition: all 0.3s ease;
        padding: 0.5rem;
        background: rgba(255, 68, 68, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 68, 68, 0.2);
      }

      .tooltip-cost.affordable {
        color: #ffd700;
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.2);
      }

      .tooltip-description {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1rem;
        margin-bottom: 1.5rem;
        line-height: 1.6;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      .tooltip-effects {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(var(--branch-color), 0.1);
        border-radius: 4px;
        border: 1px solid rgba(var(--branch-color), 0.2);
      }

      .effect {
        color: var(--branch-color);
        font-size: 1rem;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .effect:before {
        content: '✦';
        color: var(--branch-color);
        font-size: 1.2rem;
      }

      .tooltip-requirements {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 1rem;
        margin-top: 1rem;
      }

      .tooltip-requirements h5 {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1rem;
        margin: 0 0 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .tooltip-requirements h5:before {
        content: '!';
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        font-size: 0.8rem;
      }

      .tooltip-requirements ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tooltip-requirements li {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
        position: relative;
        padding: 0.5rem;
        padding-left: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        transition: all 0.3s ease;
      }

      .tooltip-requirements li::before {
        content: '×';
        position: absolute;
        left: 0.5rem;
        color: #ff4444;
        font-weight: bold;
      }

      .tooltip-requirements li.met {
        color: var(--branch-color);
        background: rgba(var(--branch-color), 0.1);
      }

      .tooltip-requirements li.met::before {
        content: '✓';
        color: #4facfe;
      }

      @keyframes scan {
        0% {
          transform: translateY(-75%) rotate(45deg);
        }
        100% {
          transform: translateY(75%) rotate(45deg);
        }
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(var(--branch-color), 0.7);
        }
        70% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px rgba(var(--branch-color), 0);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(var(--branch-color), 0);
        }
      }

      .skill-icon.pulse {
        animation: pulse 2s infinite;
      }

      .node-connections .fa-check {
        position: absolute;
        right: -8px;
        bottom: -8px;
        color: #4eff4e;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #4eff4e;
        border-radius: 50%;
        padding: 4px;
        font-size: 0.9rem;
        z-index: 10;
        box-shadow: 0 0 10px #4eff4e, inset 0 0 5px #4eff4e;
        animation: tickerGlow 2s infinite ease-in-out;
      }

      @keyframes tickerGlow {
        0% {
          box-shadow: 0 0 10px #4eff4e, inset 0 0 5px #4eff4e;
        }
        50% {
          box-shadow: 0 0 15px #4eff4e, inset 0 0 8px #4eff4e;
        }
        100% {
          box-shadow: 0 0 10px #4eff4e, inset 0 0 5px #4eff4e;
        }
      }

      .skill-check {
        position: absolute;
        right: -8px;
        bottom: -4px;
        color: #4eff4e;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #4eff4e;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        box-shadow: 0 0 10px #4eff4e, inset 0 0 5px #4eff4e;
        animation: tickerGlow 2s infinite ease-in-out;
      }

      .skill-check i {
        font-size: 1rem;
      }
    `,
  ],
})
export class SkillTreeComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  branches$: Observable<SkillBranch[]>;
  prestigePoints$: Observable<number>;
  private skillBranchesValue: Record<SkillBranchType, SkillBranch> | null =
    null;

  constructor(
    private skillService: SkillService,
    private gameService: GameService,
    private dialogService: DialogService
  ) {
    this.branches$ = this.skillService.getSkillBranches().pipe(
      map((branches) => {
        this.skillBranchesValue = branches;
        return Object.values(branches);
      })
    );

    this.prestigePoints$ = this.gameService.getPrestigePoints$();
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  close(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('overlay') ||
      (event.target as HTMLElement).classList.contains('close-button')
    ) {
      this.closeModal.emit();
    }
  }

  async purchaseSkill(skillId: string): Promise<void> {
    const skill = this.findSkill(skillId);
    if (!skill) return;

    if (!this.canAffordSkill(skill)) {
      const currentPoints =
        this.gameService.getGameState().resources.prestigePoints;
      const missingPoints = skill.cost - currentPoints;

      await this.dialogService.confirm({
        title: 'Points insuffisants',
        message: `Il vous manque ${missingPoints} points de prestige pour débloquer cette compétence.`,
        confirmText: 'OK',
        type: 'warning',
      });
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: "Confirmer l'achat",
      message: `Voulez-vous débloquer "${skill.name}" pour ${skill.cost} points de prestige ?`,
      confirmText: 'Débloquer',
      cancelText: 'Annuler',
      type: 'info',
    });

    if (confirmed) {
      this.skillService.purchaseSkill(skillId);
    }
  }

  private findSkill(skillId: string): Skill | null {
    if (!this.skillBranchesValue) return null;

    for (const branch of Object.values(this.skillBranchesValue)) {
      const skill = branch.skills.find((s) => s.id === skillId);
      if (skill) return skill;
    }
    return null;
  }

  isSkillPurchased(skillId: string): boolean {
    if (!this.skillBranchesValue) return false;

    for (const branch of Object.values(this.skillBranchesValue)) {
      const skill = branch.skills.find((s: Skill) => s.id === skillId);
      if (skill?.purchased) return true;
    }
    return false;
  }

  getSkillName(skillId: string): string {
    if (!this.skillBranchesValue) return skillId;

    for (const branch of Object.values(this.skillBranchesValue)) {
      const skill = branch.skills.find((s: Skill) => s.id === skillId);
      if (skill) return skill.name;
    }
    return skillId;
  }

  hasRequirements(skill: Skill): boolean {
    if (!skill?.requirements?.skills) return false;
    return skill.requirements.skills.length > 0;
  }

  getRequirementSkills(skill: Skill): string[] {
    if (!skill?.requirements?.skills) return [];
    return skill.requirements.skills;
  }

  isSkillAvailable(skill: Skill): boolean {
    return (
      skill.unlocked &&
      !skill.purchased &&
      this.canAffordSkill(skill) &&
      this.areRequirementsMet(skill)
    );
  }

  canAffordSkill(skill: Skill): boolean {
    const gameState = this.gameService.getGameState();
    return gameState.resources.prestigePoints >= skill.cost;
  }

  areRequirementsMet(skill: Skill): boolean {
    if (!skill.requirements?.skills) return true;
    return skill.requirements.skills.every((reqId) =>
      this.isSkillPurchased(reqId)
    );
  }

  updateTooltipPosition(event: MouseEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const x = rect.left + rect.width;
    const y = rect.top + rect.height / 2;

    // Mise à jour des variables CSS
    host.style.setProperty('--tooltip-x', `${x}px`);
    host.style.setProperty('--tooltip-y', `${y}px`);

    // Pour la dernière colonne, on positionne à gauche
    const isLastColumn = host.closest('.skill-branch:last-child') !== null;
    if (isLastColumn) {
      host.style.setProperty('--tooltip-x', `${rect.left}px`);
    }
  }
}
