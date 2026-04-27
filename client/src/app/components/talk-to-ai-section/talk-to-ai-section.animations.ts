import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupTalkToAiAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.talk-to-ai__left > *, .talk-to-ai__mockup', {
      y: 30,
      opacity: 0,
      duration: 0.65,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: '.talk-to-ai',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.talk-to-ai__features li', {
      x: -18,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.talk-to-ai__features',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.talk-to-ai__bubble, .talk-to-ai__result', {
      y: 12,
      opacity: 0,
      duration: 0.48,
      ease: 'power2.out',
      stagger: 0.18,
      scrollTrigger: {
        trigger: '.talk-to-ai__chat',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.to('.talk-to-ai__menu-trigger .fa-ellipsis', {
      scale: 1.18,
      duration: 0.72,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });

    gsap.to('.talk-to-ai__input', {
      boxShadow: '0 0 0 2px rgba(231, 200, 115, 0.28), 0 0 24px rgba(231, 200, 115, 0.25)',
      duration: 1.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }, rootElement);
}
