// Only this module owns scroll reveals. Gallery and room transitions stay independent.
export const revealHeadings = '#categories-title, #handmade-title, #olive-title, #care-title, #business-title, #newsletter-title, .handmade-item h3';
export const revealDescriptions = '.categories-intro, .handmade-subtitle, .handmade-item > p, .olive-subtitle, .olive-description, .care-contact > p, .business-description, .newsletter-description';
export const revealLabels = '';
export const revealHero = '#hero-title, .hero-description';
export const blurRevealSettings = {
  inView: true, once: true,
  viewport: { once: true, amount: .15, margin: '0px 0px -40px 0px' },
  initial: { opacity: 0, filter: 'blur(6px)', y: 6 },
  final: { opacity: 1, filter: 'blur(0px)', y: 0 },
  duration: .7, stagger: .015, ease: [.22, 1, .36, 1],
};
export function revealTokens(text, words) {
  return words ? text.split(/(\s+)/u).filter(Boolean) : [...new Intl.Segmenter('ru', { granularity: 'grapheme' }).segment(text)].map(item => item.segment);
}
export function onceReveal(play) {
  const seen = new WeakSet();
  return element => { if (seen.has(element)) return; seen.add(element); play(element); };
}

// Capture original word locations as well as block dimensions. Character splitting
// is accepted only when it preserves the original shaping and wrapping.
function textGeometry(element) {
  const box = element.getBoundingClientRect();
  const words = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (const match of node.textContent.matchAll(/\S+/gu)) {
      const range = document.createRange();
      range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
      const rect = range.getBoundingClientRect();
      words.push({ x: rect.left - box.left, y: rect.top - box.top });
    }
  }
  return { width: box.width, height: box.height, words };
}
function unchanged(before, after) {
  return Math.abs(before.width - after.width) < .5 && Math.abs(before.height - after.height) < .5 && before.words.length === after.words.length && before.words.every((word, i) => Math.abs(word.x - after.words[i].x) < .5 && Math.abs((word.y - before.words[0].y) - (after.words[i].y - after.words[0].y)) < .5);
}

function prepareText(element) {
  const original = [...element.childNodes];
  const opacity = element.style.opacity;
  const filter = element.style.filter;
  const transform = element.style.transform;
  const before = textGeometry(element);
  let units = [];
  const restoreNodes = () => element.replaceChildren(...original);
  const split = words => {
    element.replaceChildren(...original.map(node => node.cloneNode(true))); units = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const token of revealTokens(node.textContent, true)) {
        if (/^\s+$/u.test(token)) { fragment.append(document.createTextNode(token)); continue; }
        const word = document.createElement('span');
        word.className = 'blur-reveal-word';
        if (words) { word.classList.add('blur-reveal-unit'); word.textContent = token; units.push(word); }
        else for (const character of revealTokens(token, false)) {
          const unit = document.createElement('span');
          unit.className = 'blur-reveal-unit'; unit.textContent = character;
          units.push(unit); word.append(unit);
        }
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
  };
  const restore = () => {
    restoreNodes(); element.style.opacity = opacity;
    element.style.filter = filter; element.style.transform = transform;
    element.removeAttribute('data-blur-reveal');
  };
  try {
    element.setAttribute('data-blur-reveal', '');
    const cursive = getComputedStyle(element).fontFamily.includes('Caveat');
    split(cursive);
    // Group per-character nodes back into words for geometry comparison.
    const splitGeometry = () => {
      const box = element.getBoundingClientRect();
      const words = [...element.querySelectorAll('.blur-reveal-word')].map(word => { const rect = word.getBoundingClientRect(); return { x: rect.left - box.left, y: rect.top - box.top }; });
      return { width: box.width, height: box.height, words };
    };
    let mode = cursive ? 'words' : 'characters';
    if (!unchanged(before, splitGeometry())) { split(true); mode = 'words'; }
    if (!unchanged(before, splitGeometry())) {
      // Some fonts/styles cannot be safely split. Keep their exact original DOM.
      restoreNodes(); units = [element];
      element.dataset.blurReveal = 'whole';
      mode = 'whole';
    } else element.dataset.blurReveal = mode;
    element.dataset.blurRevealMode = mode;
    element.dataset.blurRevealSize = JSON.stringify([before.width, before.height]);
    element.style.opacity = '0';
    return { element, units, opacity, restore };
  } catch (error) { restore(); throw error; }
}

export async function mountReveal(root = document, runtime) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !Element.prototype.animate || !globalThis.IntersectionObserver) return;
  const { animate, inView, stagger } = runtime || await import('./assets/vendor/motion-reveal.js');
  // Fonts are local/preloaded; do not split or measure fallback lettering.
  await document.fonts.ready;
  if (preference.matches) return;
  const pending = new Map();
  const active = new Map();
  let stopObserving = () => {};
  const clear = () => {
    stopObserving();
    for (const controls of active.values()) controls.cancel();
    active.clear();
    for (const item of pending.values()) item.restore();
    pending.clear();
  };
  const play = onceReveal(element => {
    const item = pending.get(element);
    if (!item) return;
    if (preference.matches) { item.restore(); pending.delete(element); return; }
    try {
      // Mini uses native keyframes. No scrollY binding, springs, exit or remounts.
      const { initial, final, duration, ease, stagger: interval } = blurRevealSettings;
      const controls = animate(item.units, {
        opacity: [initial.opacity, final.opacity], filter: [initial.filter, final.filter], transform: [`translateY(${initial.y}px)`, `translateY(${final.y}px)`],
      }, { duration, ease, delay: stagger(interval) });
      active.set(element, controls);
      element.style.opacity = item.units[0] === element ? '1' : item.opacity;
      element.dataset.blurRevealState = 'playing';
      controls.then(() => {
        if (pending.get(element) !== item) return;
        item.restore(); pending.delete(element); active.delete(element);
        element.dataset.blurRevealState = 'done';
      }, () => { item.restore(); pending.delete(element); active.delete(element); });
    } catch (error) { item.restore(); pending.delete(element); console.warn('TERRA: text reveal skipped', error); }
  });
  try {
    const elements = [...root.querySelectorAll(`${revealHeadings}, ${revealDescriptions}, ${revealHero}`)];
    for (const element of elements) pending.set(element, prepareText(element));
    stopObserving = inView(elements, element => { play(element); }, {
      amount: blurRevealSettings.viewport.amount, margin: blurRevealSettings.viewport.margin,
    }); // Motion inView is once-only unless an exit callback is returned.
    for (const element of root.querySelectorAll(revealHero)) play(element);
    preference.addEventListener('change', event => { if (event.matches) clear(); });
    // Fail open even if another script reports an uncaught runtime failure.
    globalThis.addEventListener('error', clear, { once: true });
    globalThis.addEventListener('unhandledrejection', clear, { once: true });
    return clear;
  } catch (error) { clear(); throw error; }
}

if (typeof document !== 'undefined') mountReveal().catch(error => console.warn('TERRA: reveal unavailable', error));
