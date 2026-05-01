import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { PolicyLandingComponent } from '../../shared/policy-landing/policy-landing';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

type PrivacyPanelKey = 'collection' | 'rights';

interface PrivacyPanel {
  key: PrivacyPanelKey;
  navLabel: string;
  iconClass: string;
  kicker: string;
  title: string;
  description: string;
  points: string[];
}

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [PolicyLandingComponent],
  templateUrl: './privacy.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './privacy.page.scss']
})
export class PrivacyPage implements AfterViewInit, OnDestroy {
  @ViewChild('privacyPageRoot') private privacyPageRoot?: ElementRef<HTMLElement>;
  private privacyContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;
  protected readonly activePanelKey = signal<PrivacyPanelKey>('collection');
  protected readonly panels: readonly PrivacyPanel[] = [
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
  protected readonly activePanel = computed(
    () => this.panels.find((panel) => panel.key === this.activePanelKey()) ?? this.panels[0]
  );

  ngAfterViewInit(): void {
    this.privacyContext = setupStaticInfoPageAnimations(this.privacyPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.privacyContext?.revert();
    this.privacyContext = null;
  }

  protected selectPanel(panelKey: PrivacyPanelKey): void {
    this.activePanelKey.set(panelKey);
  }
}
