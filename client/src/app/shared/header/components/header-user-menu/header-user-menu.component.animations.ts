import { gsap } from 'gsap';

export function runHeaderUserMenuOpenAnimations(hostElement: HTMLElement): void {
  const menuPanel = hostElement.querySelector('.eventify-header__profile-menu');
  const menuHead = hostElement.querySelector('.eventify-header__profile-menu-head');
  const links = hostElement.querySelectorAll('.eventify-header__profile-link');

  gsap.fromTo(
    menuPanel,
    { y: -6, opacity: 0, scale: 0.985 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.34,
      ease: 'power2.out',
      overwrite: 'auto'
    }
  );

  gsap.fromTo(
    menuHead,
    { y: 8, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    }
  );

  gsap.fromTo(
    links,
    { y: 12, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.42,
      ease: 'power3.out',
      stagger: 0.08,
      overwrite: 'auto'
    }
  );
}
