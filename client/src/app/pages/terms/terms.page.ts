import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { PolicyInfoCardItem, PolicyInfoCardsComponent } from '../../shared/policy-info-cards/policy-info-cards';
import { PolicyLandingComponent } from '../../shared/policy-landing/policy-landing';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

type TermsPanelKey = 'booking' | 'account';

interface TermsPanel {
  key: TermsPanelKey;
  navLabel: string;
  iconClass: string;
  kicker: string;
  title: string;
  description: string;
  points: string[];
}

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [PolicyLandingComponent, PolicyInfoCardsComponent],
  templateUrl: './terms.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './terms.page.scss']
})
export class TermsPage implements AfterViewInit, OnDestroy {
  @ViewChild('termsPageRoot') private termsPageRoot?: ElementRef<HTMLElement>;
  @ViewChild('policyPanelCard') private policyPanelCard?: ElementRef<HTMLElement>;
  private termsContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;
  protected readonly activePanelKey = signal<TermsPanelKey>('booking');
  protected readonly panels: readonly TermsPanel[] = [
    {
      key: 'booking',
      navLabel: 'Bookings & Payments',
      iconClass: 'fa-solid fa-ticket',
      kicker: 'Responsibility',
      title: 'Booking Accuracy and Payment Terms',
      description:
        'When placing a booking, you are responsible for reviewing event details and ensuring payment information is valid.',
      points: [
        'Confirmation is issued only after payment is approved.',
        'Tickets and availability are managed based on organizer inventory.',
        'Refund and cancellation outcomes follow the event policy shown at checkout.'
      ]
    },
    {
      key: 'account',
      navLabel: 'Account & Conduct',
      iconClass: 'fa-solid fa-user-check',
      kicker: 'Protection',
      title: 'Account Security and Platform Conduct',
      description:
        'You must maintain account security and use Eventify responsibly without abusing services or violating laws.',
      points: [
        'Keep credentials private and report suspected unauthorized access quickly.',
        'Do not use the platform for fraud, harassment, or harmful automated activity.',
        'Repeated misuse may lead to account suspension to protect the community.'
      ]
    }
  ] as const;
  protected readonly activePanel = computed(
    () => this.panels.find((panel) => panel.key === this.activePanelKey()) ?? this.panels[0]
  );
  protected readonly summaryCards: readonly PolicyInfoCardItem[] = [
    {
      iconClass: 'fa-solid fa-calendar-xmark',
      title: 'Availability Notices',
      description: 'Event dates, pricing, and inventory may change at the organizer’s discretion.'
    },
    {
      iconClass: 'fa-solid fa-user-slash',
      title: 'Acceptable Use',
      description: 'Fraudulent, abusive, or unlawful activity may result in suspension or account termination.'
    },
    {
      iconClass: 'fa-solid fa-file-pen',
      title: 'Terms Revisions',
      description: 'Continued use of Eventify following updates constitutes acceptance of revised terms.'
    }
  ] as const;

  ngAfterViewInit(): void {
    this.termsContext = setupStaticInfoPageAnimations(this.termsPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.termsContext?.revert();
    this.termsContext = null;
  }

  protected selectPanel(panelKey: TermsPanelKey): void {
    if (this.activePanelKey() === panelKey) {
      return;
    }
    this.activePanelKey.set(panelKey);
    this.animatePanelSwap();
  }

  private animatePanelSwap(): void {
    const card = this.policyPanelCard?.nativeElement;
    if (!card) {
      return;
    }

    card.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
  }
}
