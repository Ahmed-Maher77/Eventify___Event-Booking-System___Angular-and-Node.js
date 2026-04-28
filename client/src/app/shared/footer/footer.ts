import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { setupFooterAnimations } from './footer.animations';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  @ViewChild('footerRoot') private footerRoot?: ElementRef<HTMLElement>;
  private successMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private footerContext: ReturnType<typeof setupFooterAnimations> | null = null;
  protected readonly isSubmitted = signal(false);
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

    if (this.subscribeForm.invalid) {
      this.subscribeForm.markAllAsTouched();
      return;
    }

    // just as a demo
    this.subscribeForm.reset();
    this.isSubmitted.set(true);
    this.startSuccessMessageTimer();
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    this.footerContext = setupFooterAnimations(this.footerRoot?.nativeElement);
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
