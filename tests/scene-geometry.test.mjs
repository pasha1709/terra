import test from 'node:test';
import assert from 'node:assert/strict';
import { projectHotspot } from '../scene-geometry.js';
import { scenes } from '../scenes.js';
import { readFileSync } from 'node:fs';

test('without cropping, a source point stays at the same percentage', () => {
  const point = projectHotspot({ imageWidth: 1500, imageHeight: 1000, frameWidth: 750, frameHeight: 500, point: { x: 40, y: 60 }, position: { x: 50, y: 50 } });
  assert.equal(point.x, 40);
  assert.equal(point.y, 60);
  assert.equal(point.visible, true);
});

test('a horizontal crop moves the marker with its object, rather than scaling its percentage', () => {
  const point = projectHotspot({ imageWidth: 1500, imageHeight: 1000, frameWidth: 300, frameHeight: 400, point: { x: 40, y: 60 }, position: { x: 50, y: 50 } });
  assert.equal(point.x, 30);
  assert.equal(point.y, 60);
  assert.equal(point.visible, true);
});

test('object-position affects the marker, and cropped-out objects are not clamped onto furniture', () => {
  const options = { imageWidth: 1500, imageHeight: 1000, frameWidth: 300, frameHeight: 400, point: { x: 20, y: 60 } };
  assert.equal(projectHotspot({ ...options, position: { x: 0, y: 50 } }).x, 40);
  const cropped = projectHotspot({ ...options, position: { x: 100, y: 50 } });
  assert.equal(cropped.x, -60);
  assert.equal(cropped.visible, false);
});

test('unloaded images do not produce invalid CSS coordinates', () => {
  assert.equal(projectHotspot({ imageWidth: 0, imageHeight: 0, frameWidth: 300, frameHeight: 400, point: { x: 50, y: 50 }, position: { x: 50, y: 50 } }), null);
});

test('all nine points stay on their original objects in full wide frames at desktop and mobile sizes', () => {
  for (const scene of scenes) {
    const png = readFileSync(new URL(`../${scene.image}`, import.meta.url));
    const imageWidth=png.readUInt32BE(16), imageHeight=png.readUInt32BE(20);
    for (const width of [1000,700,500,335]) for (const hotspot of scene.hotspots) {
      const projected=projectHotspot({imageWidth,imageHeight,frameWidth:width,frameHeight:width*941/1672,point:hotspot.point,position:{x:50,y:50}});
      assert.ok(projected.visible);
      assert.ok(Math.abs(projected.x-hotspot.point.x)<.01);
      assert.ok(Math.abs(projected.y-hotspot.point.y)<.01);
      assert.equal(hotspot.productId,null);
    }
  }
});
