import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupStaticInfoPageAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.policy-page__animate', {
      y: 20,
      opacity: 0,
      duration: 0.52,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.static-info-page__container',
        start: 'top 86%',
        toggleActions: 'play none none reverse'
      }
    });
  }, rootElement);
}
