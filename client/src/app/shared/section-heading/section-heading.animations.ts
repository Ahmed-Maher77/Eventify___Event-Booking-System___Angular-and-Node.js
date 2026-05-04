import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupSectionHeadingAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.section-heading h2, .section-heading p', {
      y: 36,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: '.section-heading',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });
  }, rootElement);
}
