import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpgradePanelComponent } from './upgrade-panel.component';
import { UpgradesService } from '../../../../core/services/upgrades.service';
import { BehaviorSubject } from 'rxjs';
import { UPGRADES } from '../../../../core/data/upgrades.data';

describe('UpgradePanelComponent', () => {
  let component: UpgradePanelComponent;
  let fixture: ComponentFixture<UpgradePanelComponent>;
  let upgradesService: jasmine.SpyObj<UpgradesService>;

  beforeEach(async () => {
    const upgradesServiceSpy = jasmine.createSpyObj(
      'UpgradesService',
      ['purchaseUpgrade', 'canPurchaseUpgrade'],
      {
        upgrades$: new BehaviorSubject(UPGRADES),
      }
    );

    await TestBed.configureTestingModule({
      declarations: [UpgradePanelComponent],
      providers: [{ provide: UpgradesService, useValue: upgradesServiceSpy }],
    }).compileComponents();

    upgradesService = TestBed.inject(
      UpgradesService
    ) as jasmine.SpyObj<UpgradesService>;
    fixture = TestBed.createComponent(UpgradePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display upgrade information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const upgradeItems = compiled.querySelectorAll('.upgrade-item');

    expect(upgradeItems.length).toBe(Object.keys(UPGRADES).length);
    expect(upgradeItems[0].textContent).toContain('Extraction Améliorée');
  });

  it('should handle upgrade purchase', () => {
    upgradesService.canPurchaseUpgrade.and.returnValue(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const upgradeButton = compiled.querySelector(
      '.upgrade-btn'
    ) as HTMLButtonElement;

    if (upgradeButton) {
      upgradeButton.click();
      expect(upgradesService.purchaseUpgrade).toHaveBeenCalled();
    } else {
      fail('Upgrade button not found');
    }
  });
});
