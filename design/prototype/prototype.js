import { animate, stagger } from '../node_modules/animejs/dist/bundles/anime.esm.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-menu');

function closeMenu() {
  toggle?.setAttribute('aria-expanded', 'false');
  if (menu) menu.hidden = true;
}

toggle?.addEventListener('click', () => {
  const opening = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(opening));
  menu.hidden = !opening;
  if (opening && !reduced) {
    animate(menu, { opacity: [0, 1], translateY: [-10, 0], scaleY: [.96, 1], duration: 260, ease: 'out(3)' });
  }
});

menu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    toggle?.focus();
  }
});

if (!reduced) {
  animate('.intro-item', {
    opacity: [0, 1],
    translateY: [22, 0],
    duration: 620,
    delay: stagger(70, { start: 90 }),
    ease: 'out(3)'
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target, { opacity: [0, 1], translateY: [32, 0], duration: 560, ease: 'out(3)' });
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
