import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';
import { setupFooterAnimations } from './footer.animations';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly newsletterService = inject(NewsletterService);
  @ViewChild('footerRoot') private footerRoot?: ElementRef<HTMLElement>;
  private successMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private footerContext: ReturnType<typeof setupFooterAnimations> | null = null;
  protected readonly isSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly subscribeForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly socialLinks = [
    {
      label: 'Facebook',
      url: 'https://m.facebook.com/ahmed.maher.algohary',
      iconClass: 'fa-brands fa-facebook-f',
      modifier: 'facebook',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/Ahmed-Maher77',
      iconClass: 'fa-brands fa-github',
      modifier: 'github',
    },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ahmed-maher-algohary',
      iconClass: 'fa-brands fa-linkedin-in',
      modifier: 'linkedin',
    },
    {
      label: 'WhatsApp-work',
      url: 'https://wa.me/+201150383416',
      iconClass: 'fa-brands fa-whatsapp',
      modifier: 'whatsapp',
    },
  ] as const;

  protected subscribeNewsletter(): void {
    this.isSubmitted.set(false);
    this.errorMessage.set('');

    if (this.subscribeForm.invalid) {
      this.subscribeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { email } = this.subscribeForm.getRawValue();

    this.newsletterService
      .subscribe({
        email: email ?? '',
      })
      .subscribe({
        next: () => {
          this.subscribeForm.reset();
          this.isSubmitted.set(true);
          this.startSuccessMessageTimer();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Subscription failed. Please try again.',
          );
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    const footerElement = this.footerRoot?.nativeElement;
    if (!footerElement) {
      return;
    }
    this.footerContext = setupFooterAnimations(footerElement);
  }

  ngOnDestroy(): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
      this.successMessageTimer = null;
    }
    this.footerContext?.revert();
    this.footerContext = null;
  }

  private startSuccessMessageTimer(): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }

    this.successMessageTimer = setTimeout(() => {
      this.isSubmitted.set(false);
      this.successMessageTimer = null;
    }, 2000);
  }
}
