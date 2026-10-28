import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCollectionsGallery } from '../collections-gallery.js';
import { GALLERY_SPEED } from '../gallery-geometry.js';

function fixture() {
  const frames = new Map();
  let serial = 0;
  let disconnects = 0;
  const make = () => Object.assign(new EventTarget(), { dataset: {} });
  const motion = Object.assign(make(), { matches: false });
  const win = Object.assign(make(), {
    matchMedia: () => motion,
    getComputedStyle: () => ({ width: '259.2px', getPropertyValue: () => '10px' }),
    requestAnimationFrame: (cb) => { frames.set(++serial, cb); return serial; },
    cancelAnimationFrame: (id) => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() { disconnects++; } },
  });
  const doc = Object.assign(make(), { defaultView: win, hidden: false });
  const stage = Object.assign(make(), { clientWidth: 1440 });
  const panels = Array.from({ length: 22 }, (_, index) => ({ hasAttribute: () => index >= 11, style: { removeProperty(name) { delete this[name]; } } }));
  const root = Object.assign(make(), { ownerDocument: doc, querySelector: () => stage, querySelectorAll: () => panels });
  const destroy = mountCollectionsGallery(root);
  function tick(time) { const [id, cb] = frames.entries().next().value; frames.delete(id); cb(time); }
  return { root, stage, panels, win, doc, motion, frames, destroy, tick, get disconnects() { return disconnects; } };
}

test('hover, focus and scrolling do not interrupt the timeline; reduced motion and teardown work', () => {
  const f = fixture();
  assert.equal(f.frames.size, 1);
  for (const type of ['pointerenter','focusin','scroll','pointerleave','focusout']) f.root.dispatchEvent(new Event(type));
  assert.equal(f.frames.size, 1);
  f.motion.matches = true;
  f.motion.dispatchEvent(new Event('change'));
  assert.equal(f.frames.size, 0);
  assert.equal(f.stage.tabIndex, 0);
  assert.equal(f.root.dataset.reduced, 'true');
  f.stage.scrollLeft = 480;
  f.motion.matches = false;
  f.motion.dispatchEvent(new Event('change'));
  assert.equal(f.stage.scrollLeft, 0);
  assert.equal(f.frames.size, 1);
  f.doc.hidden = true;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.frames.size, 0);
  f.doc.hidden = false;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.frames.size, 1);
  f.destroy(); f.destroy();
  assert.equal(f.frames.size, 0);
  assert.equal(f.disconnects, 1);
  assert.equal(f.root.dataset.ready, undefined);
});

test('two full controller cycles use the fractional frame width plus the exact gap', () => {
  const f = fixture();
  const cycle = 11 * (259.2 + 10);
  const period = cycle / GALLERY_SPEED * 1000;
  f.tick(0);
  const before = f.panels[2].style.transform;
  for (let time = 16; time < period * 2; time += 16) f.tick(time);
  f.tick(period * 2 + 1);
  assert.equal(f.root.dataset.completedLoops, '2');
  assert.ok(f.panels[2].style.transform.includes('perspective(1600px)'));
  assert.notEqual(before, f.panels[2].style.transform);
  f.destroy();
});
