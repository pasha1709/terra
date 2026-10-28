import test from 'node:test';
import assert from 'node:assert/strict';
import { panelPose, wrap, advanceGallery, GALLERY_SPEED } from '../gallery-geometry.js';

test('the centre panel faces the viewer and edges curve symmetrically', () => {
  const centre = panelPose(2, 2 * 260, 7, 260, 1440);
  assert.equal(centre.x, 0);
  assert.equal(centre.angle, 0);
  assert.equal(centre.scale, 1);
  const left = panelPose(0, 2 * 260, 7, 260, 1440);
  const right = panelPose(4, 2 * 260, 7, 260, 1440);
  assert.equal(left.x, -right.x);
  assert.equal(left.angle, -right.angle);
  assert.ok(left.scale > 1);
});
test('the geometry is periodic at a complete physical track length', () => {
  for (let index = 0; index < 7; index++) {
    assert.deepEqual(panelPose(index, 100, 7, 260, 1440), panelPose(index, 1920, 7, 260, 1440));
  }
  assert.equal(wrap(-1, 1820), 1819);
});
test('panels wrap only beyond the faded edges and mobile tilt is restrained', () => {
  const edge = panelPose(0, 11 * 260 / 2 - .01, 22, 260, 1440);
  assert.equal(edge.opacity, 0);
  assert.ok(Math.abs(panelPose(1, 0, 7, 280, 390).angle) <= 24);
});
test('only reduced motion and a hidden document stop the continuous timeline', () => {
  for (const flags of [{ reduced: true }, { documentHidden: true }]) {
    assert.equal(advanceGallery(100, 1000, 1820, flags), 100);
  }
  for (const state of [{}, { hovered: true }, { focused: true }, { visible: false }]) assert.equal(advanceGallery(100, 1000, 1820, state), 100 + GALLERY_SPEED);
});

test('two complete 11-photo cycles stay linear and the repeated copy joins exactly', () => {
  const count = 11;
  const step = 269.2;
  const length = count * step;
  const period = length / GALLERY_SPEED * 1000;
  for (let lap = 0; lap < 2; lap++) {
    for (let frame = 0; frame <= 600; frame++) {
      const time = lap * period + frame / 600 * period;
      const phase = advanceGallery(0, time, length, {});
      assert.ok(Math.abs(phase - wrap(time * GALLERY_SPEED / 1000, length)) < 1e-6);
    }
  }
  for (let index = 0; index < count; index++) {
    const end = panelPose(index + count, length, count * 2, step, 1440);
    const start = panelPose(index, 0, count * 2, step, 1440);
    for (const key of ['x', 'angle', 'scale', 'opacity']) assert.ok(Math.abs(end[key] - start[key]) < 1e-9);
  }
});
