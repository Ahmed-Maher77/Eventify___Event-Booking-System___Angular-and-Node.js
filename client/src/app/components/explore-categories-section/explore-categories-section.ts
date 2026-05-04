import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { ExploreCategoryItem } from './explore-categories-section.model';
import { setupExploreCategoriesAnimations } from './explore-categories-section.animations';

@Component({
  selector: 'app-explore-categories-section',
  imports: [CommonModule, RouterLink, SectionHeadingComponent],
  templateUrl: './explore-categories-section.html',
  styleUrl: './explore-categories-section.scss',
})
export class ExploreCategoriesSection implements AfterViewInit, OnDestroy {
  @ViewChild('exploreCategoriesRoot') private exploreCategoriesRoot?: ElementRef<HTMLElement>;
  private exploreContext: ReturnType<typeof setupExploreCategoriesAnimations> | null = null;

  protected readonly categories: ExploreCategoryItem[] = [
    {
      name: 'Concert',
      description: 'Live music and performances',
      iconClass: 'fa-solid fa-music'
    },
    {
      name: 'Conference',
      description: 'Industry talks and networking',
      iconClass: 'fa-solid fa-users-line'
    },
    {
      name: 'Workshop',
      description: 'Hands-on learning sessions',
      iconClass: 'fa-regular fa-lightbulb'
    },
    {
      name: 'Seminar',
      description: 'Expert-led educational events',
      iconClass: 'fa-solid fa-graduation-cap'
    },
    {
      name: 'Sports',
      description: 'Matches, tournaments, and fitness events',
      iconClass: 'fa-solid fa-futbol'
    }
  ];

  protected categoryToQuery(categoryName: string): string {
    return categoryName.trim().toLowerCase();
  }

  ngAfterViewInit(): void {
    this.exploreContext = setupExploreCategoriesAnimations(this.exploreCategoriesRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.exploreContext?.revert();
    this.exploreContext = null;
  }
}
