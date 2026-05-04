import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupContactPageAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: {
        trigger: '.contact-page',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });

    timeline
      .from('.contact-page__eyebrow, .contact-page__title, .contact-page__subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1
      })
      .from(
        '.contact-page__info-card',
        {
          x: -20,
          opacity: 0,
          duration: 0.5
        },
        '-=0.2'
      )
      .from(
        '.contact-page__meta-block',
        {
          y: 16,
          opacity: 0,
          duration: 0.45,
          stagger: 0.12
        },
        '-=0.2'
      )
      .from(
        '.contact-page__social-link',
        {
          y: 14,
          opacity: 0,
          duration: 0.38,
          stagger: 0.08
        },
        '-=0.2'
      )
      .from(
        '.contact-page__form-card',
        {
          x: 20,
          opacity: 0,
          duration: 0.52
        },
        '-=0.4'
      )
      .from(
        '.contact-page__field',
        {
          y: 14,
          opacity: 0,
          duration: 0.36,
          stagger: 0.07
        },
        '-=0.22'
      )
      .from(
        '.contact-page__submit-wrap',
        {
          y: 12,
          opacity: 0,
          duration: 0.34
        },
        '-=0.1'
      );
  }, rootElement);
}
