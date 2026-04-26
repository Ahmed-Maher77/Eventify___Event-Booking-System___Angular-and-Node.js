import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ExploreCategoryItem {
  name: string;
  description: string;
  iconClass: string;
}

@Component({
  selector: 'app-explore-categories-section',
  imports: [CommonModule, RouterLink],
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
}
