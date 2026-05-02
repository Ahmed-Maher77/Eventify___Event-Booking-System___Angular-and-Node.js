import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupFooterAnimations(rootElement?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    const timeline = gsap.timeline({ paused: true });
    const animatedSelectors = [
      '.site-footer__top > section',
      '.site-footer__social-group',
      '.site-footer__social-link',
      '.site-footer__copyright'
    ];

    timeline.from('.site-footer__top > section', {
      y: 24,
      opacity: 0,
      duration: 0.56,
      ease: 'power3.out',
      stagger: 0.12
    });

    timeline.from('.site-footer__social-group', {
      y: 16,
      opacity: 0,
      duration: 0.44,
      ease: 'power2.out'
    }, '-=0.2');

    timeline.from('.site-footer__social-link', {
      y: 6,
      opacity: 0,
      duration: 0.36,
      ease: 'power2.out',
      stagger: 0.06
    }, '-=0.18');

    timeline.from('.site-footer__copyright', {
      y: 12,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    }, '-=0.16');

    timeline.eventCallback('onComplete', () => {
      // Remove GSAP inline styles so hover transforms remain perfectly centered.
      gsap.set(animatedSelectors, { clearProps: 'transform,opacity' });
    });

    if (rootElement) {
      ScrollTrigger.create({
        trigger: rootElement,
        start: 'top 94%',
        onEnter: () => timeline.restart(),
        onEnterBack: () => timeline.restart(),
      });
    }
  }, rootElement);
}
