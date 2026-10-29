// Progressive enhancement: HTML is visible before/without this module.
// Animate only on entry; never leave content in a persistent hidden state.
export function mountReveal(root = document) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !Element.prototype.animate || !globalThis.IntersectionObserver) return;
  const compact = matchMedia('(max-width: 600px)');
  const seen = new WeakSet();
  const running = new Set();
  const records = new Map();

  function play(element, delay = 0, words = false, intro = false) {
    if (seen.has(element)) return;
    seen.add(element);
    if (motion.matches) return;
    const targets = words ? splitWords(element) : [element];
    targets.forEach((target, index) => {
      const animation = target.animate([
        { opacity: 0, translate: `0 ${compact.matches ? 12 : 20}px` },
        { opacity: 1, translate: '0 0' },
      ], {
        duration: intro ? 600 : 720,
        delay: (compact.matches ? delay * .6 : delay) + index * (compact.matches ? 35 : 55),
        easing: 'cubic-bezier(.22, 1, .36, 1)',
        fill: 'backwards',
      });
      running.add(animation);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    });
  }

  // Keep whitespace text nodes and existing line wrappers / <br> intact.
  // Inline spans (not inline-blocks) preserve the original line shaping.
  function splitWords(heading) {
    if (heading.dataset.revealWords) return [...heading.querySelectorAll('.reveal-word')];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/u)) {
        if (!part) continue;
        if (/^\s+$/u.test(part)) fragment.append(document.createTextNode(part));
        else {
          const word = document.createElement('span');
          word.className = 'reveal-word';
          word.textContent = part;
          fragment.append(word);
        }
      }
      node.replaceWith(fragment);
    }
    heading.dataset.revealWords = 'true';
    return [...heading.querySelectorAll('.reveal-word')];
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const { delay, words } = records.get(entry.target);
      play(entry.target, delay, words);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  function register(selector, delay = 0, words = false, stagger = 0) {
    root.querySelectorAll(selector).forEach((element, index) => {
      records.set(element, { delay: delay + index * stagger, words });
      observer.observe(element);
    });
  }

  // Avoid nested reveals inside either independently animated gallery.
  register('#collections .display-heading, #handmade .display-heading, #olive-chalk .display-heading, #customer-care .display-heading, #business .display-heading, #newsletter .display-heading', 0, true);
  register('.categories-heading .eyebrow, .handmade-intro .eyebrow, .olive-badge, .care-copy .eyebrow, .business-copy > .eyebrow, .newsletter-content > .eyebrow');
  register('.categories-intro, .handmade-subtitle, .olive-subtitle, .olive-description, .care-contact, .business-description, .newsletter-description', 140);
  register('.terra-gallery, #in-life, .care-photo, .newsletter-collage');
  register('.handmade-item', 0, false, 80);
  register('.care-group', 0, false, 80);
  register('.business-audience > li', 100, false, 80);
  register('.terra-gallery-catalog, .olive-collection-link, .olive-products, .business-actions, .newsletter-form, .newsletter-consent', 180);

  // Hero photograph intentionally has no reveal dependency.
  root.querySelectorAll('.hero-copy > *, .hero .product-card').forEach((element, index) => {
    play(element, Math.min(index * 60, 180), element.matches('.display-heading'), true);
  });
  // Never keep an active animation on a control the visitor is using.
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
  // No CSS visibility gate: even an initialization failure leaves HTML usable.
  console.warn('TERRA: reveal animation unavailable', error);
}
