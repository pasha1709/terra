import test from 'node:test';
import assert from 'node:assert/strict';
import { mountReveal } from '../reveal.js';

test('reveals once, preserves existing transforms, and cancels on reduced motion', () => {
  const original = { matchMedia: globalThis.matchMedia, Element: globalThis.Element, IntersectionObserver: globalThis.IntersectionObserver };
  const animations = [];
  let observed;
  let motionChange;
  let disconnected = false;
  const motion = { matches: false, addEventListener: (_, listener) => { motionChange = listener; } };
  const element = { animate(frames, options) {
    const animation = { frames, options, effect: { target: element }, finished: new Promise(() => {}), cancel() { this.cancelled = true; }, finish() { this.finishedEarly = true; } };
    animations.push(animation);
    return animation;
  }, contains: target => target === element };
  const listeners = {};
  const root = { querySelectorAll: selector => selector === '.terra-gallery, #in-life, .care-photo, .newsletter-collage' ? [element] : [], addEventListener: (type, listener) => { listeners[type] = listener; } };
  try {
    globalThis.matchMedia = query => query.includes('reduced-motion') ? motion : { matches: false };
    globalThis.Element = class { animate() {} };
    globalThis.IntersectionObserver = class {
      constructor(callback, options) { observed = { callback, options }; }
      observe() {}
      unobserve() {}
      disconnect() { disconnected = true; }
    };
    mountReveal(root);
    assert.equal(animations.length, 0, 'offscreen content has no persistent hidden animation');
    observed.callback([{ target: element, isIntersecting: false }]);
    assert.equal(animations.length, 0);
    observed.callback([{ target: element, isIntersecting: true }]);
    observed.callback([{ target: element, isIntersecting: true }]);
    assert.equal(animations.length, 1, 'returning to the section cannot replay it');
    assert.equal(animations[0].options.duration, 720);
    assert.equal(animations[0].frames[0].translate, '0 20px');
    assert.ok(!('transform' in animations[0].frames[0]));
    assert.equal(animations[0].options.fill, 'backwards', 'no retained final style');
    listeners.focusin({ target: element });
    assert.equal(animations[0].finishedEarly, true);
    motionChange({ matches: true });
    assert.equal(disconnected, true);
    assert.equal(animations[0].cancelled, true);
    motion.matches = true;
    mountReveal(root);
    assert.equal(animations.length, 1, 'reduced motion adds no effects');
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
