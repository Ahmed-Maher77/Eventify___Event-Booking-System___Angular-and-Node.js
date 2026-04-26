import { Component } from '@angular/core';
import { CallToActionSection } from '../../components/call-to-action-section/call-to-action-section';
import { ExploreCategoriesSection } from '../../components/explore-categories-section/explore-categories-section';
import { FeaturedEventsSection } from '../../components/featured-events-section/featured-events-section';
import { HowItWorksSection } from '../../components/how-it-works-section/how-it-works-section';
import { LandingSection } from '../../components/landing-section/landing-section';
import { TalkToAiSection } from '../../components/talk-to-ai-section/talk-to-ai-section';
import { TestimonialsSectionSection } from '../../components/testimonials-section-section/testimonials-section-section';
import { TrustedCompaniesSection } from '../../components/trusted-companies-section/trusted-companies-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    LandingSection,
    TrustedCompaniesSection,
    FeaturedEventsSection,
    ExploreCategoriesSection,
    HowItWorksSection,
    TestimonialsSectionSection,
    TalkToAiSection,
    CallToActionSection
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {}
