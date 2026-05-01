import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PolicyInfoCardItem, PolicyInfoCardsComponent } from '../../shared/policy-info-cards/policy-info-cards';
import { PolicyLandingComponent } from '../../shared/policy-landing/policy-landing';
import { PolicyPanelItem, PolicyPanelSwitcherComponent } from '../../shared/policy-panel-switcher/policy-panel-switcher';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [PolicyLandingComponent, PolicyPanelSwitcherComponent, PolicyInfoCardsComponent],
  templateUrl: './terms.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class TermsPage implements AfterViewInit, OnDestroy {
  @ViewChild('termsPageRoot') private termsPageRoot?: ElementRef<HTMLElement>;
  private termsContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;
  protected readonly panels: readonly PolicyPanelItem[] = [
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
}
