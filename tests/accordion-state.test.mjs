import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccordionState } from '../accordion-state.js';

const items = Array.from({ length: 6 }, (_, index) => ({ id: `question-${index}`, answer: `Test answer ${index}` }));

test('switching through all six answers leaves only the last requested item open', () => {
  const state = createAccordionState(items, 'question-0');
  assert.equal(state.openId, 'question-0');
  for (const item of items.slice(1)) {
    state.toggle(item.id);
    assert.equal(state.openId, item.id);
    assert.equal(items.filter(({ id }) => state.isOpen(id)).length, 1);
  }
});

test('a repeated activation closes the answer and rapid switches do not restore an old answer', () => {
  const state = createAccordionState(items, 'question-0');
  state.toggle('question-0');
  assert.equal(state.openId, null);
  for (const id of ['question-2', 'question-5', 'question-1', 'question-5']) state.toggle(id);
  assert.equal(state.openId, 'question-5');
  state.toggle('question-5');
  assert.equal(state.openId, null);
});

test('unwritten answers cannot open empty panels or close the current answer', () => {
  const state = createAccordionState([...items, { id: 'missing', answer: null }, { id: 'blank', answer: '  ' }], 'question-0');
  for (const id of ['missing', 'blank', 'unknown']) {
    assert.equal(state.isAvailable(id), false);
    state.toggle(id);
    assert.equal(state.openId, 'question-0');
  }
});

test('an unavailable initial answer stays closed', () => {
  const state = createAccordionState([{ id: 'missing', answer: null }], 'missing');
  assert.equal(state.openId, null);
});
