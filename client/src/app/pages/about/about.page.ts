import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { Button } from '../../shared/button/button';
import { setupAboutPageAnimations } from './about.page.animations';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [SectionHeadingComponent, Button],
  templateUrl: './about.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class AboutPage implements AfterViewInit, OnDestroy {
  @ViewChild('aboutPageRoot') private aboutPageRoot?: ElementRef<HTMLElement>;
  private aboutContext: ReturnType<typeof setupAboutPageAnimations> | null = null;

  ngAfterViewInit(): void {
    this.aboutContext = setupAboutPageAnimations(this.aboutPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.aboutContext?.revert();
    this.aboutContext = null;
  }

  protected readonly aboutHighlights = [
    {
      index: '1.',
      title: 'Who We Are',
      description: 'A product-focused team building intuitive tools that make event planning and booking effortless.'
    },
    {
      index: '2.',
      title: 'What We Do',
      description: 'We unify discovery, filtering, ticketing, and confirmations into one reliable platform.'
    },
    {
      index: '3.',
      title: 'How We Help',
      description: 'From personalized recommendations to smooth checkout, we reduce friction at every step.'
    },
    {
      index: '4.',
      title: 'Create Success Stories',
      description: 'We help attendees find better experiences and help organizers grow their event reach.'
    }
  ] as const;

  protected readonly aboutGalleryImages = [
    {
      src: '/images/Conference.jpg',
      alt: 'Modern conference hall setup'
    },
    {
      src: '/images/Seminar.jpg',
      alt: 'Seminar audience and speaker'
    },
    {
      src: '/images/Workshop.png',
      alt: 'Workshop collaboration scene'
    },
    {
      src: '/images/Concert.png',
      alt: 'Live concert atmosphere'
    }
  ] as const;

  protected readonly teamMembers = [
    {
      name: 'Ahmed Maher Algohary',
      role: 'Web Developer & Designer',
      imageUrl: '/images/team_members/ahmed-maher.jpg',
      profileUrl: 'https://www.linkedin.com/in/ahmed-maher-algohary'
    },
    {
      name: 'Mohamed Rashad',
      role: 'Mobile Developer',
      imageUrl: '/images/team_members/mohamed-rashad.jpeg',
      profileUrl: 'https://www.linkedin.com/in/mohamed-rashad-2bb024288/'
    },
    {
      name: 'Mohamed Awadallah',
      role: 'Mobile Developer',
      imageUrl: '/images/team_members/mohamed-awadallah.jpg',
      profileUrl: 'https://www.linkedin.com/in/mohamed-awadallah-ma/'
    },
    {
      name: 'Yasser Eid',
      role: 'Mobile Developer',
      imageUrl: '/images/team_members/yasser-eid.jpg',
      profileUrl: 'https://www.linkedin.com/in/yasser-eid-18a45521a/'
    }
  ] as const;
}
