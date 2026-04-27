import { gsap } from 'gsap';

export function setupLandingSectionAnimations(rootElement: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    timeline
      .from('.landing-hero__eyebrow', { y: 16, opacity: 0, duration: 0.45 })
      .from('.landing-hero__title-wrap', { y: 28, opacity: 0, duration: 0.55 }, '-=0.1')
      .from('.landing-hero__search', { y: 24, opacity: 0, duration: 0.5 }, '-=0.18')
      .from('.landing-hero__actions > *', { y: 20, opacity: 0, duration: 0.45, stagger: 0.1 }, '-=0.18');
  }, rootElement);
}
