import { Component, input } from '@angular/core';

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: string;
};

@Component({
  selector: 'app-faq-accordion',
  imports: [],
  templateUrl: './faq-accordion.html',
  styleUrl: './faq-accordion.scss',
})
export class FaqAccordion {
  readonly items = input.required<readonly FaqAccordionItem[]>();
  protected openFaqIndex = 0;

  protected isOpen(index: number): boolean {
    return this.openFaqIndex === index;
  }

  protected toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? -1 : index;
  }
}
