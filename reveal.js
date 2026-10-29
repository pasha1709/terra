// Text-only progressive enhancement. HTML is visible without this module.
export const revealHeadings = '#categories-title, #life-title, #handmade-title, #olive-title, #care-title, #business-title, #newsletter-title, .handmade-item h3';
export const revealDescriptions = '.categories-intro, .life-intro, .handmade-subtitle, .handmade-item > p, .olive-subtitle, .olive-description, .care-contact > p, .business-description, .newsletter-description';
export const revealLabels = '.categories-heading .eyebrow, .life-heading > .eyebrow, .handmade-intro .eyebrow, .olive-badge, .care-copy .eyebrow, .business-copy > .eyebrow, .newsletter-content > .eyebrow';
export const revealHero = '.hero-copy > .eyebrow, #hero-title, .hero-description';

export function mountReveal(root = document) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !Element.prototype.animate || !globalThis.IntersectionObserver) return;
  const compact = matchMedia('(max-width: 600px)');
  const seen = new WeakSet();
  const running = new Set();
  const delays = new Map();

  function play(element, delay = 0, intro = false) {
    if (seen.has(element)) return;
    seen.add(element);
    if (motion.matches) return;
    const animation = element.animate([
      { opacity: 0, translate: `0 ${compact.matches ? 12 : 16}px` },
      { opacity: 1, translate: '0 0' },
    ], {
      duration: intro ? 600 : 720,
      delay,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards',
    });
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      play(entry.target, delays.get(entry.target));
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  function register(selector, delay = 0) {
    root.querySelectorAll(selector).forEach(element => {
      delays.set(element, delay);
      observer.observe(element);
    });
  }
  // Explicit text nodes only: no section/card wrappers, images, icons or controls.
  // The room slider's changing products are managed exclusively by inspiration.js.
  register(revealHeadings);
  register(revealLabels);
  register(revealDescriptions, 100);
  root.querySelectorAll(revealHero).forEach(element => {
    play(element, element.matches('.hero-description') ? 100 : 0, true);
  });
  const finishWithin = target => {
    for (const animation of running) {
      if (target === animation.effect?.target || animation.effect?.target?.contains(target)) animation.finish();
    }
  };
  root.addEventListener('focusin', event => finishWithin(event.target));
  root.addEventListener('pointerdown', event => finishWithin(event.target), { passive: true });
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    for (const animation of running) animation.cancel();
    running.clear();
  });
}

if (typeof document !== 'undefined') try { mountReveal(); } catch (error) {
  // No CSS visibility gate: failure cannot leave persistent invisible content.
  console.warn('TERRA: reveal animation unavailable', error);
}
