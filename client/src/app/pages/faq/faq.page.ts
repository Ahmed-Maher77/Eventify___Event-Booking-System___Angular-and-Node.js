import { Component } from '@angular/core';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  templateUrl: './faq.page.html',
  styleUrl: '../../../sass/components/faq-page.scss'
})
export class FaqPage {
  protected readonly faqs = [
    {
      id: '01',
      question: 'How do I book a ticket on Eventify?',
      answer:
        'Open any event details page, choose your ticket type and quantity, then continue to secure checkout. Your confirmation appears instantly after successful payment.'
    },
    {
      id: '02',
      question: 'Can I cancel or modify my booking?',
      answer:
        'Cancellation and edit policies depend on the organizer. You can check each policy inside the event page and your booking details before confirming.'
    },
    {
      id: '03',
      question: 'What payment methods are supported?',
      answer:
        'Eventify supports common debit and credit cards through secure payment gateways. Additional methods may appear based on your location.'
    },
    {
      id: '04',
      question: 'Where can I find my tickets after booking?',
      answer:
        'Go to My Bookings from your profile menu. You will find your confirmed tickets, event details, and booking status in one place.'
    },
    {
      id: '05',
      question: 'How can I contact support quickly?',
      answer:
        'Use the Contact page or in-app support channels. Include your booking reference so our team can resolve your request faster.'
    }
  ] as const;

  protected openFaqIndex = 0;

  protected isOpen(index: number): boolean {
    return this.openFaqIndex === index;
  }

  protected toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? -1 : index;
  }
}
