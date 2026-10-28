import test from 'node:test';
import assert from 'node:assert/strict';
import { careQuestions } from '../care-data.js';
import { createAccordionState } from '../accordion-state.js';

test('all six published care questions have approved nonempty answers and can toggle', () => {
  assert.equal(careQuestions.length, 6);
  for (const item of careQuestions) {
    assert.equal(typeof item.answer, 'string', item.id);
    const state = createAccordionState([item]);
    assert.equal(state.isAvailable(item.id), true, item.id);
    state.toggle(item.id);
    assert.equal(state.isOpen(item.id), true, item.id);
    state.toggle(item.id);
    assert.equal(state.isOpen(item.id), false, item.id);
  }
});

test('care groups retain independent open answers and replace only a sibling', () => {
  const states = ['order', 'delivery', 'aftercare'].map(group => {
    const items = careQuestions.filter(item => item.group === group);
    assert.equal(items.length, 2);
    return { items, state: createAccordionState(items, group === 'order' ? 'order' : null) };
  });
  for (const {items, state} of states) state.toggle(items[1].id);
  assert.deepEqual(states.map(({state}) => state.openId), ['payment', 'returns', 'care']);
  states[1].state.toggle('delivery');
  assert.deepEqual(states.map(({state}) => state.openId), ['payment', 'delivery', 'care']);
});
