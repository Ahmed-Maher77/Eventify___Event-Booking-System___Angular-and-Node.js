import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupTestimonialsAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const timeline = gsap.timeline({
      paused: true,
      defaults: { immediateRender: false }
    });

    timeline.from('.testimonials-section__inner > *', {
      y: 24,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.12
    });

    timeline.from('.testimonials-section__badge', {
      y: 18,
      opacity: 0,
      duration: 0.42,
      ease: 'power2.out'
    }, '-=0.3');

    timeline.from('.testimonials-section__content h2', {
      y: 24,
      opacity: 0,
      duration: 0.54,
      ease: 'power3.out'
    }, '-=0.2');

    timeline.from('.testimonials-section__description', {
      y: 18,
      opacity: 0,
      duration: 0.46,
      ease: 'power2.out'
    }, '-=0.3');

    timeline.from('.testimonials-section__stat', {
      y: 16,
      opacity: 0,
      duration: 0.44,
      ease: 'power2.out',
      stagger: 0.1
    }, '-=0.2');

    timeline.from('.testimonials-section__testimonial', {
      x: 24,
      opacity: 0,
      duration: 0.58,
      ease: 'power3.out'
    }, '-=0.2');

    timeline.from('.testimonials-section__person, .testimonials-section__quote-text, .testimonials-section__controls > *', {
      y: 14,
      opacity: 0,
      duration: 0.42,
      ease: 'power2.out',
      stagger: 0.08
    });

    const sectionTrigger = ScrollTrigger.create({
      trigger: '.testimonials-section',
      start: 'top 90%',
      onEnter: () => timeline.restart(),
      onEnterBack: () => timeline.restart()
    });

    if (sectionTrigger.isActive) {
      timeline.restart();
    }
  }, rootElement);
}
