import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupCallToActionAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.cta-section__card',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });

    timeline.from('.cta-section__card', {
      y: 24,
      opacity: 0,
      duration: 0.56,
      ease: 'power2.out'
    });

    timeline.from('.cta-section__content h2', {
      y: 22,
      opacity: 0,
      duration: 0.52,
      ease: 'power3.out'
    }, '-=0.28');

    timeline.from('.cta-section__content p', {
      y: 18,
      opacity: 0,
      duration: 0.48,
      ease: 'power2.out'
    }, '-=0.3');

    timeline.from('.cta-section__actions > *', {
      y: 16,
      opacity: 0,
      scale: 0.96,
      duration: 0.48,
      ease: 'power3.out',
      stagger: 0.12
    });
  }, rootElement);
}
