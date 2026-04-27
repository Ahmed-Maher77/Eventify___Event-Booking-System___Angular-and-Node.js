import { gsap } from 'gsap';

export function runHeaderNavLinksAnimation(navRoot?: HTMLElement): void {
  if (!navRoot) {
    return;
  }

  const targets = navRoot.querySelectorAll(
    '.eventify-header__mobile-close, .eventify-header__nav-link, .eventify-header__actions > *'
  );

  if (!targets.length) {
    return;
  }

  gsap.fromTo(
    targets,
    { y: 16, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.08,
      overwrite: 'auto'
    }
  );
}

export function runHeaderChromeAnimation(navRoot?: HTMLElement): void {
  if (!navRoot) {
    return;
  }

  gsap.fromTo(
    ['.eventify-header__brand', '.eventify-header__toggler'],
    { y: -10, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.46,
      ease: 'power2.out',
      stagger: 0.08,
      overwrite: 'auto'
    }
  );
}

export function runMainHeaderMenuOpenAnimation(): void {
  if (window.matchMedia('(min-width: 992px)').matches) {
    return;
  }

  gsap.fromTo(
    '.eventify-header__collapse',
    { opacity: 0, y: 18, scale: 0.992 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.36,
      ease: 'power2.out',
      overwrite: 'auto'
    }
  );
}

export function setupHeaderAnimations(hostElement: HTMLElement, navRoot?: HTMLElement): gsap.Context {
  return gsap.context(() => {
    runHeaderChromeAnimation(navRoot);
    runHeaderNavLinksAnimation(navRoot);
  }, hostElement);
}
