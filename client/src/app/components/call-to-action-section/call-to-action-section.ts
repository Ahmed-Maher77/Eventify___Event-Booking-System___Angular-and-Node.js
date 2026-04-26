import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-call-to-action-section',
  imports: [RouterLink, Button],
  templateUrl: './call-to-action-section.html',
  styleUrl: './call-to-action-section.scss',
})
export class CallToActionSection {}
