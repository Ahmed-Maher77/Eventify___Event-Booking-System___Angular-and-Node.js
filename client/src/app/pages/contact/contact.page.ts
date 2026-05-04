import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../shared/button/button';
import { ContactService } from '../../services/contact.service';
import { setupContactPageAnimations } from './contact.page.animations';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, Button],
  standalone: true,
  templateUrl: './contact.page.html',
  styleUrl: '../../../sass/components/contact-page.scss'
})
export class ContactPage implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  @ViewChild('contactPageRoot') private contactPageRoot?: ElementRef<HTMLElement>;
  private successMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private contactContext: ReturnType<typeof setupContactPageAnimations> | null = null;
  protected readonly isSubmitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly contactForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(4)]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });
  protected readonly controls = this.contactForm.controls;

  protected readonly socialLinks = [
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com',
      modifier: 'linkedin'
    },
    {
      label: 'GitHub',
      url: 'https://github.com',
      modifier: 'github'
    },
    {
      label: 'Facebook',
      url: 'https://www.facebook.com',
      modifier: 'facebook'
    }
  ] as const;

  protected submitContactForm(): void {
    this.isSubmitted.set(false);
    this.errorMessage.set('');

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { fullName, email, subject, message } = this.contactForm.getRawValue();

    this.contactService
      .submitMessage({
        fullName: fullName ?? '',
        email: email ?? '',
        subject: subject ?? '',
        message: message ?? '',
      })
      .subscribe({
        next: () => {
          this.contactForm.reset();
          this.isSubmitted.set(true);
          this.startSuccessMessageTimer();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Failed to send your message. Please try again.',
          );
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  protected isFieldInvalid(fieldName: keyof typeof this.controls): boolean {
    const control = this.controls[fieldName];
    return control.touched && control.invalid;
  }

  ngAfterViewInit(): void {
    this.contactContext = setupContactPageAnimations(this.contactPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
      this.successMessageTimer = null;
    }
    this.contactContext?.revert();
    this.contactContext = null;
  }

  private startSuccessMessageTimer(): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }

    this.successMessageTimer = setTimeout(() => {
      this.isSubmitted.set(false);
      this.successMessageTimer = null;
    }, 2200);
  }
}
