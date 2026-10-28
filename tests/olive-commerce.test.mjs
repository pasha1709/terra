import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartAction, resolveCollectionItem } from '../olive-commerce.js';

test('a rapid second activation cannot send a duplicate cart request', async () => {
  let finish;
  const calls = [];
  const counts = [];
  const add = createCartAction({ add: (id) => { calls.push(id); return new Promise((resolve) => { finish = resolve; }); }, getCount: () => 3 }, (count) => counts.push(count));
  const first = add({ id: 'real-sku', available: true });
  assert.equal((await add({ id: 'real-sku', available: true })).status, 'busy');
  assert.deepEqual(calls, ['real-sku']);
  assert.deepEqual(counts, []);
  finish();
  assert.equal((await first).status, 'success');
  assert.deepEqual(counts, [3]);
});

test('reference data, unavailable products and disconnected carts never create a purchase', async () => {
  let calls = 0;
  const add = createCartAction({ add: async () => { calls++; }, getCount: () => 1 }, () => {});
  assert.equal((await add({ id: null, available: true })).status, 'unavailable');
  assert.equal((await add({ id: 'sku', available: false })).status, 'unavailable');
  assert.equal((await createCartAction(null, () => {})({ id: 'sku', available: true })).status, 'unavailable');
  assert.equal(calls, 0);
});

test('a failed request releases the lock for an explicit retry and never updates the count', async () => {
  let attempts = 0;
  const counts = [];
  const add = createCartAction({ add: async () => { if (++attempts === 1) throw new Error('network'); }, getCount: () => 1 }, (count) => counts.push(count));
  assert.equal((await add({ id: 'sku', available: true })).status, 'error');
  assert.deepEqual(counts, []);
  assert.equal((await add({ id: 'sku', available: true })).status, 'success');
  assert.deepEqual(counts, [1]);
});

test('a count refresh failure does not misreport a confirmed purchase as failed', async () => {
  const add = createCartAction({ add: async () => {}, getCount: () => { throw new Error('count offline'); } }, () => {});
  assert.deepEqual(await add({ id: 'sku', available: true }), { status: 'success', countSynced: false });
});

test('catalog data takes priority over reference prices, without creating another product', async () => {
  const reference = { key: 'preview', productId: 'real-sku', name: 'Макет', price: 7800 };
  const actual = { id: 'real-sku', name: 'Название из каталога', details: '1 л', price: 6900, currency: 'RUB', available: true, url: '/products/real-sku' };
  const result = await resolveCollectionItem(reference, { getById: async (id) => { assert.equal(id, 'real-sku'); return actual; } });
  assert.equal(result.mode, 'ready');
  assert.equal(result.product.price, 6900);
  assert.equal(result.product.name, 'Название из каталога');
  assert.equal(result.product.id, 'real-sku');
});

test('a mismatched catalog ID fails closed instead of buying a similar product', async () => {
  const result = await resolveCollectionItem({ productId: 'correct' }, { getById: async () => ({ id: 'wrong', name: 'Wrong', details: '', price: 3400, available: true }) });
  assert.equal(result.mode, 'error');
});

test('without catalog bindings reference prices remain display-only', async () => {
  const result = await resolveCollectionItem({ productId: null, price: 7800 }, null);
  assert.equal(result.mode, 'reference');
  assert.equal(result.product.price, 7800);
  assert.equal(result.product.id, null);
  assert.equal(result.product.available, false);
});
