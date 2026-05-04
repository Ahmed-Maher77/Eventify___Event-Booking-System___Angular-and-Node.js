import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupFooterAnimations(rootElement?: HTMLElement | null): gsap.Context | null {
  if (!rootElement) {
    return null;
  }

  return gsap.context(() => {
    const topSections = gsap.utils.toArray<HTMLElement>('.site-footer__top > section');
    const socialGroups = gsap.utils.toArray<HTMLElement>('.site-footer__social-group');
    const socialLinks = gsap.utils.toArray<HTMLElement>('.site-footer__social-link');
    const copyrightBlocks = gsap.utils.toArray<HTMLElement>('.site-footer__copyright');
    const animatedElements = [...topSections, ...socialGroups, ...socialLinks, ...copyrightBlocks];

    // No-op safely if footer content is not rendered yet.
    if (!animatedElements.length) {
      return;
    }

    const timeline = gsap.timeline({ paused: true });

    if (topSections.length) {
      timeline.from(topSections, {
        y: 24,
        opacity: 0,
        duration: 0.56,
        ease: 'power3.out',
        stagger: 0.12,
        immediateRender: false
      });
    }

    if (socialGroups.length) {
      timeline.from(socialGroups, {
        y: 16,
        opacity: 0,
        duration: 0.44,
        ease: 'power2.out',
        immediateRender: false
      }, '-=0.2');
    }

    if (socialLinks.length) {
      timeline.from(socialLinks, {
        y: 6,
        opacity: 0,
        duration: 0.36,
        ease: 'power2.out',
        stagger: 0.06,
        immediateRender: false
      }, '-=0.18');
    }

    if (copyrightBlocks.length) {
      timeline.from(copyrightBlocks, {
        y: 12,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        immediateRender: false
      }, '-=0.16');
    }

    timeline.eventCallback('onComplete', () => {
      // Remove GSAP inline styles so hover transforms remain perfectly centered.
      gsap.set(animatedElements, { clearProps: 'transform,opacity' });
    });

    const trigger = ScrollTrigger.create({
      trigger: rootElement,
      start: 'top 94%',
      onEnter: () => timeline.restart(),
      onEnterBack: () => timeline.restart(),
    });

    return () => {
      trigger.kill();
      timeline.kill();
    };
  }, rootElement);
}
