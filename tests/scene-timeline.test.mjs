import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneTimeline, validSceneProduct } from '../scene-timeline.js';

function setup() {
  let time = 0, id = 0;
  const pending = new Map(), changes = [], progress = [];
  const clock = createSceneTimeline({ requestFrame: fn => { pending.set(++id, fn); return id; }, cancelFrame: n => pending.delete(n), onChange: (index, manual) => changes.push([index, manual]), onProgress: value => progress.push(value) });
  const advance = ms => { time += ms; const jobs = [...pending.values()]; pending.clear(); jobs.forEach(fn => fn(time)); };
  return { clock, pending, changes, progress, advance };
}
test('two automatic cycles hold each room for four seconds and wrap directly to room one', () => {
  const {clock, advance, changes} = setup();
  clock.block('outside', false); advance(0);
  for (let i=0;i<6;i++) { advance(3999); assert.equal(changes.length,i); advance(1); clock.ready(); advance(0); }
  assert.deepEqual(changes.map(c=>c[0]),[1,2,0,1,2,0]);
  clock.destroy();
});
test('pause and hidden tab freeze progress, while manual selection starts a fresh four seconds', () => {
  const {clock, advance, changes, pending, progress} = setup();
  clock.block('outside', false); advance(0); advance(2500);
  assert.equal(progress.at(-1), .625);
  clock.block('user',true); clock.block('hidden',true); advance(60000);
  assert.equal(pending.size,0); assert.equal(progress.at(-1),.625);
  clock.block('user',false); assert.equal(pending.size,0);
  clock.block('hidden',false); advance(0); advance(1499); assert.equal(changes.length,0);
  advance(1); assert.deepEqual(changes.at(-1),[1,false]);
  clock.ready(); clock.select(2); assert.deepEqual(changes.at(-1),[2,true]); clock.ready(); advance(0); advance(3999); assert.equal(changes.length,2);
  advance(1); assert.deepEqual(changes.at(-1),[0,false]);
  clock.destroy(); clock.ready(); clock.block('outside',false); assert.equal(pending.size,0);
});
test('product bindings reject missing, mismatched and incomplete catalog records', () => {
  const record={id:'real-id',name:'Реальный товар',price:2400,url:'/products/real-id'};
  assert.equal(validSceneProduct(null,record),false);
  assert.equal(validSceneProduct('another-id',record),false);
  assert.equal(validSceneProduct('real-id',{...record,price:null}),false);
  assert.equal(validSceneProduct('real-id',{...record,url:'javascript:alert(1)'}),false);
  assert.equal(validSceneProduct('real-id',record),true);
});

test('reduced motion keeps manual room selection while no automatic frame is scheduled', () => {
  const {clock, pending, changes, advance} = setup();
  clock.block('reduced',true); clock.block('outside',false);
  advance(60000); assert.equal(pending.size,0); assert.equal(changes.length,0);
  clock.select(2); clock.ready(); assert.equal(pending.size,0); assert.deepEqual(changes,[[2,true]]);
  clock.block('reduced',false); advance(0); advance(4000); assert.deepEqual(changes.at(-1),[0,false]);
  clock.destroy();
});

test('rapid selections and repeated resume never schedule more than one animation frame', () => {
  const {clock, pending, advance, changes} = setup();
  clock.block('outside',false); clock.ready(); clock.ready();
  assert.equal(pending.size,1);
  for (const index of [2,0,1,1]) { clock.select(index); assert.equal(pending.size,0); clock.ready(); assert.equal(pending.size,1); }
  advance(0); advance(3999); assert.equal(changes.length,4);
  advance(1); assert.deepEqual(changes.at(-1),[2,false]);
  clock.destroy(); assert.equal(pending.size,0);
});
