import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PolicyInfoCardItem, PolicyInfoCardsComponent } from '../../shared/policy-info-cards/policy-info-cards';
import { PolicyLandingComponent } from '../../shared/policy-landing/policy-landing';
import { PolicyPanelItem, PolicyPanelSwitcherComponent } from '../../shared/policy-panel-switcher/policy-panel-switcher';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [PolicyLandingComponent, PolicyPanelSwitcherComponent, PolicyInfoCardsComponent],
  templateUrl: './privacy.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class PrivacyPage implements AfterViewInit, OnDestroy {
  @ViewChild('privacyPageRoot') private privacyPageRoot?: ElementRef<HTMLElement>;
  private privacyContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;
  protected readonly panels: readonly PolicyPanelItem[] = [
    {
      key: 'collection',
      navLabel: 'Data Collection',
      iconClass: 'fa-solid fa-database',
      kicker: 'Purpose',
      title: 'What Data We Collect and Why',
      description:
        'We gather only the data needed to deliver bookings, account access, support, and platform reliability.',
      points: [
        'Account profile details are used for identity, communication, and secure access.',
        'Booking activity helps us provide confirmations, history, and issue resolution.',
        'Technical analytics is used to improve performance and prevent abuse.'
      ]
    },
    {
      key: 'rights',
      navLabel: 'Your Rights',
      iconClass: 'fa-solid fa-shield-halved',
      kicker: 'Control',
      title: 'How You Control Your Information',
      description:
        'You stay in control of your personal data with update, access, and deletion request options.',
      points: [
        'You can request corrections to outdated account information.',
        'You can request account deletion where retention is not legally required.',
        'You can opt out from non-essential promotional communication.'
      ]
    }
  ] as const;
  protected readonly summaryCards: readonly PolicyInfoCardItem[] = [
    {
      iconClass: 'fa-solid fa-clock-rotate-left',
      title: 'Retention Schedule',
      description: 'Records are retained only for defined legal, accounting, and service-support periods.'
    },
    {
      iconClass: 'fa-solid fa-user-lock',
      title: 'Access Control',
      description: 'Sensitive data access is role-based, logged, and limited to approved operational needs.'
    },
    {
      iconClass: 'fa-solid fa-shield',
      title: 'Security Oversight',
      description: 'Safeguards are reviewed periodically to maintain confidentiality, integrity, and availability.'
    }
  ] as const;

  ngAfterViewInit(): void {
    this.privacyContext = setupStaticInfoPageAnimations(this.privacyPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.privacyContext?.revert();
    this.privacyContext = null;
  }
}
