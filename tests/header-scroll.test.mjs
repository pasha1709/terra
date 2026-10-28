import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeaderVisibility, mountHeaderScroll } from '../header-scroll.js';

test('the first 80px always show the header and stopping preserves visibility', () => {
  const update = createHeaderVisibility();
  assert.equal(update(80), true);
  assert.equal(update(85), true);
  assert.equal(update(93), false);
  assert.equal(update(93), false);
  assert.equal(update(75), true);
});

test('a 12px reversal reveals the header far from the page top', () => {
  const update = createHeaderVisibility();
  assert.equal(update(1800), false);
  assert.equal(update(1794), false);
  assert.equal(update(1788), true);
  assert.equal(update(1788), true);
  assert.equal(update(1793), true);
  assert.equal(update(1800), false);
});

test('small alternating movements do not flicker the header', () => {
  const update = createHeaderVisibility();
  update(500);
  for (const y of [499, 501, 497, 500, 496, 498]) assert.equal(update(y), false);
  assert.equal(update(484), true);
});

test('menu and keyboard focus locks show the header and reset pending travel', () => {
  const update = createHeaderVisibility();
  update(500);
  assert.equal(update(700, 1000, true), true);
  assert.equal(update(800, 1000, true), true);
  assert.equal(update(800, 1000, false), true);
  assert.equal(update(810, 1000, false), true);
  assert.equal(update(812, 1000, false), false);
});

test('mobile rubber band overscroll is clamped at both boundaries', () => {
  const update = createHeaderVisibility();
  assert.equal(update(-60, 1000), true);
  assert.equal(update(0, 1000), true);
  assert.equal(update(1000, 1000), false);
  assert.equal(update(1060, 1000), false);
  assert.equal(update(1010, 1000), false);
  assert.equal(update(1000, 1000), false);
  assert.equal(update(988, 1000), true);
});

test('unmount cancels queued work after focus and removes scroll listeners', () => {
  const frames = new Map();
  let nextFrame = 0;
  let disconnected = false;
  const win = new EventTarget();
  Object.assign(win, {
    scrollY: 0, innerHeight: 800,
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
  });
  const header = new EventTarget();
  Object.assign(header, {
    dataset: {}, contains: () => true,
    ownerDocument: { defaultView: win, activeElement: { matches: () => true }, documentElement: { scrollHeight: 3000 } },
  });
  const unmount = mountHeaderScroll(header, { getAttribute: () => 'false' });
  win.dispatchEvent(new Event('scroll'));
  header.dispatchEvent(new Event('focusin'));
  unmount();
  unmount();
  assert.equal(frames.size, 0);
  assert.equal(disconnected, true);
  assert.equal(header.dataset.scrollHidden, undefined);
  win.dispatchEvent(new Event('scroll'));
  assert.equal(frames.size, 0);
});
