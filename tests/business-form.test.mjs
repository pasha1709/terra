import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBusinessForm, createBusinessSender, isBusinessReady } from '../business-form.js';

const values = { intent: 'project', name: '  Анна  ', contact: 'anna@example.invalid', projectType: 'restaurant', description: '  Подбор предметов  ' };
const configured = (submit) => ({ submit, privacyUrl: '/approved-policy', consent: null });

test('name and a real-shaped email or phone are required; description and type are optional', () => {
  assert.deepEqual(Object.keys(validateBusinessForm({ name: '', contact: 'bad' }).errors), ['name', 'contact']);
  const email = validateBusinessForm({ ...values, projectType: '', description: '' });
  assert.deepEqual(email.errors, {});
  assert.equal(email.payload.name, 'Анна');
  assert.equal(email.payload.projectType, null);
  assert.deepEqual(validateBusinessForm({ ...values, contact: '+7 (999) 123-45-67' }).errors, {});
  assert.ok(validateBusinessForm({ ...values, projectType: 'invented' }).errors.projectType);
});

test('catalogue requests carry their own subject; consent is checked only when configured', () => {
  const result = validateBusinessForm({ ...values, intent: 'catalogue' });
  assert.equal(result.payload.subject, 'Запрос коммерческого каталога');
  assert.equal('consent' in result.payload, false);
  assert.ok(validateBusinessForm(values, { consent: { label: 'Approved text', required: true } }).errors.consent);
  assert.deepEqual(validateBusinessForm({ ...values, consent: true }, { consent: { label: 'Approved text', required: true } }).errors, {});
});

test('missing handler or policy never transmits contact details or reports success', async () => {
  let calls = 0;
  const submit = async () => { calls++; return { ok: true }; };
  for (const settings of [{}, { submit }, { privacyUrl: '/approved-policy' }]) {
    assert.equal(isBusinessReady(settings), false);
    assert.equal((await createBusinessSender(settings)(values)).status, 'unavailable');
  }
  assert.equal(calls, 0);
});

test('pending requests block double activation; only an explicit accepted response succeeds', async () => {
  let finish;
  const payloads = [];
  const send = createBusinessSender(configured((payload) => { payloads.push(payload); return new Promise(resolve => { finish = resolve; }); }));
  const first = send(values);
  assert.equal((await send(values)).status, 'busy');
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].description, 'Подбор предметов');
  finish({ ok: true });
  assert.equal((await first).status, 'success');
  assert.equal((await createBusinessSender(configured(async () => undefined))(values)).status, 'error');
  assert.equal((await createBusinessSender(configured(async () => ({ ok: false })))(values)).status, 'error');
});

test('validation prevents transmission and a server error releases the lock without changing input', async () => {
  let attempts = 0;
  const original = { ...values };
  const send = createBusinessSender(configured(async () => { if (++attempts === 1) throw new Error('offline'); return { ok: true }; }));
  assert.equal((await send({ ...values, contact: '' })).status, 'invalid');
  assert.equal(attempts, 0);
  assert.equal((await send(values)).status, 'error');
  assert.deepEqual(values, original);
  assert.equal((await send(values)).status, 'success');
});
