import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupAboutPageAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    gsap.from('.static-info-page__about-title, .static-info-page__about-lead', {
      y: 24,
      opacity: 0,
      duration: 0.58,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.static-info-page__about-showcase',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.static-info-page__about-point', {
      y: 20,
      opacity: 0,
      duration: 0.52,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.static-info-page__about-panel',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.static-info-page__about-gallery-item', {
      y: 22,
      opacity: 0,
      scale: 0.98,
      duration: 0.56,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: {
        trigger: '.static-info-page__about-gallery',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('.static-info-page__feature-card', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: '.static-info-page__section--grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      }
    });

    const teamCardsTimeline = gsap.timeline({
      paused: true,
      defaults: { immediateRender: false }
    });

    teamCardsTimeline.from('.static-info-page__team-showcase .row > [class*="col-"]', {
      y: 34,
      opacity: 0,
      scale: 0.95,
      duration: 0.62,
      ease: 'power3.out',
      stagger: 0.18,
      clearProps: 'transform,opacity'
    });

    const teamCardsTrigger = ScrollTrigger.create({
      trigger: '.static-info-page__team-showcase',
      start: 'top 94%',
      onEnter: () => teamCardsTimeline.restart(),
      onEnterBack: () => teamCardsTimeline.restart()
    });

    if (teamCardsTrigger.isActive) {
      teamCardsTimeline.restart();
    }

    gsap.from('.static-info-page__cta > *', {
      y: 16,
      opacity: 0,
      duration: 0.46,
      ease: 'power2.out',
      stagger: 0.09,
      scrollTrigger: {
        trigger: '.static-info-page__cta',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });
  }, rootElement);
}
