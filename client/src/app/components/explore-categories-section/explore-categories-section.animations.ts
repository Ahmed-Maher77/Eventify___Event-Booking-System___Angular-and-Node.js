import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupExploreCategoriesAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.explore-categories__card', {
      y: 34,
      opacity: 0,
      scale: 0.975,
      duration: 0.68,
      ease: 'power3.out',
      stagger: 0.14,
      scrollTrigger: {
        trigger: '.explore-categories__grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });
  }, rootElement);
}
