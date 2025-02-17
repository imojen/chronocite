import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillService } from '../../../../core/services/skill.service';
import {
  Skill,
  SkillBranch,
  SkillBranchType,
} from '../../../../core/models/skill.model';
import { NumberFormatPipe } from '../../../../core/pipes/number-format.pipe';
import { map, take } from 'rxjs/operators';
import { GameService } from '../../../../core/services/game.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Observable, of } from 'rxjs';

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
          <div class="skill-branches">
            @for (branch of branches$ | async; track branch.id) {
            <div class="branch" [style.--branch-color]="branch.color">
              <div class="branch-header" (click)="toggleBranch(branch.id)">
                <div class="branch-title">
                  <i class="fas fa-{{ branch.icon }}"></i>
                  <span>{{ branch.name }}</span>
                </div>
                <div class="branch-progress">
                  {{ getBranchProgress(branch) }}
                </div>
              </div>
              @if (isExpanded(branch.id)) {
              <div class="skills-list">
                @for (skill of branch.skills; track skill.id) {
                <div
                  class="skill-item"
                  [class.unlocked]="skill.unlocked"
                  [class.purchased]="skill.purchased"
                  [class.available]="
                    !skill.purchased && isSkillAvailable(skill)
                  "
                >
                  <div class="skill-header">
                    <div class="skill-info">
                      <div class="skill-name">
                        <i class="fas fa-{{ skill.icon }}"></i>
                        <span>{{ skill.name }}</span>
                      </div>
                      <div class="skill-description">
                        {{ skill.description }}
                      </div>
                      @if (skill.effects.length > 0) {
                      <div class="skill-effects">
                        @for (effect of skill.effects; track effect.type) {
                        <div class="effect">{{ effect.description }}</div>
                        }
                      </div>
                      } @if (hasRequirements(skill)) {
                      <div class="skill-requirements">
                        <div class="requirements-title">Prérequis :</div>
                        <div class="requirements-list">
                          @for (reqId of getRequirementSkills(skill); track
                          reqId) {
                          <div
                            class="requirement"
                            [class.met]="isSkillPurchased(reqId)"
                          >
                            {{ getSkillName(reqId) }}
                          </div>
                          }
                        </div>
                      </div>
                      }
                    </div>
                    <div class="skill-actions">
                      @if (skill.purchased) {
                      <div class="skill-status purchased">
                        <i class="fas fa-check"></i>
                        <span>Acquis</span>
                      </div>
                      } @else if (!skill.unlocked) {
                      <div class="skill-status locked">
                        <i class="fas fa-lock"></i>
                        <span>Verrouillé</span>
                      </div>
                      } @else {
                      <div
                        class="skill-cost"
                        [class.not-affordable]="!canAffordSkill(skill)"
                      >
                        <i class="fas fa-star"></i>
                        {{ skill.cost | number : '1.0-0' }}
                      </div>
                      <button
                        class="purchase-button"
                        [disabled]="!isSkillAvailable(skill)"
                        (click)="purchaseSkill(skill.id)"
                      >
                        <i class="fas fa-unlock"></i>
                        <span>Débloquer</span>
                      </button>
                      }
                    </div>
                  </div>
                </div>
                }
              </div>
              }
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
        z-index: 2000;
      }

      .modal-container {
        background: rgba(13, 17, 23, 0.95);
        border-radius: 12px;
        width: 95%;
        height: 95%;
        max-width: 1200px;
        position: relative;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
        z-index: 2001;
      }

      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        background: rgba(13, 17, 23, 0.98);
        z-index: 2002;
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
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .modal-content {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
      }

      .skill-branches {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .branch {
        background: rgba(30, 36, 44, 0.8);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .branch-header {
        padding: 1.5rem;
        background: rgba(13, 17, 23, 0.5);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
      }

      .branch-header:hover {
        background: rgba(13, 17, 23, 0.7);
      }

      .branch-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--branch-color);
        font-size: 1.2rem;
        font-weight: 500;
      }

      .branch-title i {
        font-size: 1.1rem;
        opacity: 0.9;
      }

      .branch-progress {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
      }

      .skills-list {
        padding: 0;
      }

      .skill-item {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
        position: relative;
        background: rgba(30, 36, 44, 0.8);
      }

      /* Style pour les skills verrouillés */
      .skill-item:not(.unlocked) {
        background: rgba(13, 17, 23, 0.95);
        border: 1px solid rgba(255, 68, 68, 0.3);
      }

      .skill-item:not(.unlocked)::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        pointer-events: none;
      }

      .skill-item:not(.unlocked) .skill-name,
      .skill-item:not(.unlocked) .skill-description,
      .skill-item:not(.unlocked) .skill-effects,
      .skill-item:not(.unlocked) .skill-requirements {
        opacity: 0.4;
      }

      /* Style pour les skills disponibles à l'achat */
      .skill-item.available {
        background: rgba(30, 36, 44, 0.95);
        border: 1px solid rgba(255, 215, 0, 0.3);
        box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.05);
      }

      .skill-item.available .skill-name {
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
      }

      .skill-item.available .effect {
        border: 1px solid rgba(255, 215, 0, 0.2);
        background: rgba(255, 215, 0, 0.05);
        color: #ffd700;
      }

      /* Style pour les skills achetés */
      .skill-item.purchased {
        background: rgba(30, 36, 44, 0.95);
        border: 1px solid rgba(74, 222, 128, 0.3);
        box-shadow: inset 0 0 20px rgba(74, 222, 128, 0.05);
      }

      .skill-item.purchased .skill-name {
        color: #4ade80;
        text-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
      }

      .skill-item.purchased .effect {
        border: 1px solid rgba(74, 222, 128, 0.2);
        background: rgba(74, 222, 128, 0.05);
        color: #4ade80;
      }

      /* Boutons et statuts */
      .skill-status.locked {
        background: rgba(255, 68, 68, 0.15);
        color: #ff4444;
        border: 1px solid rgba(255, 68, 68, 0.3);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 0.5rem 1rem;
      }

      .skill-status.purchased {
        background: rgba(74, 222, 128, 0.15);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.3);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 0.5rem 1rem;
      }

      .purchase-button {
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        color: #ffd700;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .purchase-button:hover:not(:disabled) {
        background: rgba(255, 215, 0, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
      }

      .purchase-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.3);
      }

      .purchase-button i {
        font-size: 0.9rem;
      }

      .skill-status {
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .skill-status.locked {
        background: rgba(255, 68, 68, 0.15);
        color: #ff4444;
        border: 1px solid rgba(255, 68, 68, 0.3);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0.5rem 1rem;
      }

      .skill-status.locked i {
        font-size: 1rem;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }

      @media (max-width: 768px) {
        .modal-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
          margin-top: 60px;
        }

        .modal-header {
          padding: 1rem;
        }

        .modal-content {
          padding: 1rem;
        }

        .skill-branches {
          gap: 1rem;
        }

        .branch-header {
          padding: 1rem;
        }

        .skill-item {
          padding: 1rem;
        }

        .skill-header {
          flex-direction: column;
        }

        .skill-actions {
          width: 100%;
          justify-content: space-between;
          margin-top: 1rem;
        }
      }

      @media (max-width: 480px) {
        .modal-container {
          margin-top: 50px;
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        h2 {
          font-size: 1.3rem;
        }

        .branch-title {
          font-size: 1.1rem;
        }

        .skill-name {
          font-size: 1rem;
        }

        .skill-description {
          font-size: 0.9rem;
        }
      }

      .skill-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
        position: relative;
      }

      .skill-info {
        flex: 1;
      }

      .skill-name {
        color: #fff;
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .skill-name i {
        color: var(--branch-color);
        font-size: 1rem;
      }

      .skill-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 1rem;
      }

      .skill-effects {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .effect {
        color: var(--branch-color);
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      .effect:before {
        content: '✦';
        font-size: 1rem;
      }

      .skill-requirements {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .requirements-title {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .requirements-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .requirement {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
        padding: 0.3rem 0.6rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }

      .requirement.met {
        color: #4ade80;
        background: rgba(74, 222, 128, 0.1);
      }

      .requirement.met:before {
        content: '✓';
      }

      .requirement:not(.met):before {
        content: '×';
        color: #ff4444;
      }

      .skill-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .skill-cost {
        color: #ffd700;
        font-size: 0.9rem;
        padding: 0.4rem 0.8rem;
        background: rgba(255, 215, 0, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 215, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .skill-cost.not-affordable {
        color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
        border-color: rgba(255, 68, 68, 0.2);
      }
    `,
  ],
})
export class SkillTreeComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  private expandedBranches = new Set<SkillBranchType>();
  branches$: Observable<SkillBranch[]>;
  prestigePoints$: Observable<number>;

  constructor(
    private skillService: SkillService,
    private gameService: GameService,
    private dialogService: DialogService,
    private notificationService: NotificationService
  ) {
    this.branches$ = this.skillService
      .getSkillBranches()
      .pipe(map((branches) => Object.values(branches)));
    this.prestigePoints$ = this.gameService.getPrestigePoints$();
  }

  ngOnInit() {
    // Les branches sont maintenant toutes fermées par défaut
  }

  toggleBranch(branchId: SkillBranchType) {
    if (this.expandedBranches.has(branchId)) {
      this.expandedBranches.delete(branchId);
    } else {
      this.expandedBranches.add(branchId);
    }
  }

  isExpanded(branchId: SkillBranchType): boolean {
    return this.expandedBranches.has(branchId);
  }

  getBranchProgress(branch: SkillBranch): string {
    const purchasedSkills = branch.skills.filter(
      (skill) => skill.purchased
    ).length;
    const totalSkills = branch.skills.length;
    return `${purchasedSkills}/${totalSkills}`;
  }

  hasRequirements(skill: Skill): boolean {
    return Boolean(skill.requirements?.skills?.length);
  }

  getRequirementSkills(skill: Skill): string[] {
    return skill.requirements?.skills || [];
  }

  getSkillName(skillId: string): string {
    let name = skillId;
    this.branches$.pipe(take(1)).subscribe((branches) => {
      for (const branch of branches) {
        const skill = branch.skills.find((s) => s.id === skillId);
        if (skill) {
          name = skill.name;
          break;
        }
      }
    });
    return name;
  }

  isSkillPurchased(skillId: string): boolean {
    let purchased = false;
    this.branches$.pipe(take(1)).subscribe((branches) => {
      for (const branch of branches) {
        const skill = branch.skills.find((s) => s.id === skillId);
        if (skill?.purchased) {
          purchased = true;
          break;
        }
      }
    });
    return purchased;
  }

  canAffordSkill(skill: Skill): boolean {
    let canAfford = false;
    this.prestigePoints$.pipe(take(1)).subscribe((points) => {
      canAfford = points >= skill.cost;
    });
    return canAfford;
  }

  isSkillAvailable(skill: Skill): boolean {
    if (!skill.unlocked || skill.purchased) return false;
    if (!this.canAffordSkill(skill)) return false;
    if (!skill.requirements?.skills) return true;

    return skill.requirements.skills.every((reqId) =>
      this.isSkillPurchased(reqId)
    );
  }

  purchaseSkill(skillId: string): void {
    const success = this.skillService.purchaseSkill(skillId);
    of(success).subscribe({
      next: (result: boolean) => {
        if (!result) {
          this.notificationService.show(
            "Impossible d'acheter cette compétence. Vérifiez que vous avez assez de points et que les prérequis sont remplis.",
            'error'
          );
        }
      },
      error: (error: unknown) => {
        this.notificationService.show(
          "Une erreur est survenue lors de l'achat de la compétence.",
          'error'
        );
      },
    });
  }

  close(event: MouseEvent) {
    if (
      event.target instanceof Element &&
      (event.target.classList.contains('overlay') ||
        event.target.classList.contains('close-button'))
    ) {
      this.closeModal.emit();
    }
  }
}
