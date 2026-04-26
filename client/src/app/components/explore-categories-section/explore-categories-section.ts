import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { ExploreCategoryItem } from './explore-categories-section.model';

@Component({
  selector: 'app-explore-categories-section',
  imports: [CommonModule, RouterLink, SectionHeadingComponent],
  templateUrl: './explore-categories-section.html',
  styleUrl: './explore-categories-section.scss',
})
export class ExploreCategoriesSection {
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
}
