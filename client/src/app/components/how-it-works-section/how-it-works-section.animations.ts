import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupHowItWorksAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.how-it-works__icon-shell', {
      y: 16,
      opacity: 0,
      scale: 0.9,
      duration: 0.56,
      ease: 'power3.out',
      stagger: 0.12,
      clearProps: 'transform',
      scrollTrigger: {
        trigger: '.how-it-works__steps',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.how-it-works__step h3, .how-it-works__step p', {
      y: 14,
      opacity: 0,
      duration: 0.48,
      ease: 'power2.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '.how-it-works__steps',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });
  }, rootElement);
}
