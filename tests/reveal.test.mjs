import test from 'node:test';
import assert from 'node:assert/strict';
import { mountReveal, blurRevealSettings, revealTokens, onceReveal, revealHeadings, revealDescriptions, revealLabels, revealHero } from '../reveal.js';

test('BlurReveal uses an autonomous once-only 15% viewport trigger and the requested tween', () => {
  assert.deepEqual(blurRevealSettings.viewport, { once: true, amount: .15, margin: '0px 0px -40px 0px' });
  assert.deepEqual(blurRevealSettings.initial, { opacity: 0, filter: 'blur(6px)', y: 6 });
  assert.deepEqual(blurRevealSettings.final, { opacity: 1, filter: 'blur(0px)', y: 0 });
  assert.equal(blurRevealSettings.duration, .7);
  assert.equal(blurRevealSettings.stagger, .015);
  assert.deepEqual(blurRevealSettings.ease, [.22, 1, .36, 1]);
  const element = {};
  let calls = 0;
  const enter = onceReveal(() => { calls++; });
  enter(element); enter(element); enter(element);
  assert.equal(calls, 1, 'leaving/re-entering cannot restart or cancel a reveal');
});

test('splitting preserves whitespace, Cyrillic and graphemes; Caveat uses whole words', () => {
  const text = 'Предметы,  которые\nменяют ощущение дома.';
  assert.equal(revealTokens(text, true).join(''), text);
  assert.ok(revealTokens(text, true).includes('ощущение'));
  assert.equal(revealTokens('е\u0308 🌷', false).length, 3);
  assert.equal(revealTokens(text, false).join(''), text);
});

test('scroll reveal excludes controls, photos, parent sections, FAQ answers and slider transitions', () => {
  const selectors = [revealHeadings, revealDescriptions, revealLabels, revealHero].join(',');
  for (const forbidden of ['.product-card', '.handmade-item,', '.care-group', '.life-products', '#life-title', '.life-intro', '.hero-actions', '.benefits', '.terra-gallery', '.newsletter-collage', 'button', 'img', '.newsletter-form', '.business-actions', '.care-answer']) {
    assert.equal(selectors.includes(forbidden), false, forbidden);
  }
});

test('reduced motion and unsupported browsers never split or hide content', async () => {
  const original = { matchMedia: globalThis.matchMedia, Element: globalThis.Element, IntersectionObserver: globalThis.IntersectionObserver };
  const root = { querySelectorAll() { assert.fail('content must remain untouched'); } };
  try {
    globalThis.matchMedia = () => ({ matches: true });
    await mountReveal(root);
    globalThis.matchMedia = () => ({ matches: false });
    globalThis.Element = class { };
    await mountReveal(root);
    globalThis.Element.prototype.animate = () => {};
    globalThis.IntersectionObserver = undefined;
    await mountReveal(root);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
