import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewsletterEmail, createNewsletterSender } from '../newsletter-form.js';
test('email validation trims whitespace and rejects invalid addresses', () => {
  assert.equal(validateNewsletterEmail('  test@example.invalid  ').email, 'test@example.invalid');
  for (const value of ['', 'bad', 'a@b', 'a b@example.invalid']) assert.ok(validateNewsletterEmail(value).error);
});
test('missing connections cannot subscribe, and ambiguous responses are not success', async () => {
  let calls=0;
  const subscribe=async()=>{calls++;return {ok:true};};
  assert.equal((await createNewsletterSender({subscribe})('test@example.invalid')).status,'unavailable');
  assert.equal(calls,0);
  assert.equal((await createNewsletterSender({subscribe,privacyUrl:'/policy'})('test@example.invalid')).status,'error');
});
test('double activation is blocked and confirmation is distinct from subscription', async () => {
  let finish; let calls=0;
  const send=createNewsletterSender({privacyUrl:'/policy',subscribe:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  const request=send('test@example.invalid');
  assert.equal((await send('test@example.invalid')).status,'busy');
  assert.equal(calls,1);finish({ok:true,status:'confirmation_required'});
  assert.equal((await request).status,'confirmation_required');
  assert.equal((await createNewsletterSender({privacyUrl:'/policy',subscribe:async()=>({ok:true,status:'subscribed'})})('test@example.invalid')).status,'subscribed');
});
test('errors release the request lock for retry without logging or changing the email', async () => {
  let calls=0; const values=[];
  const send=createNewsletterSender({privacyUrl:'/policy',subscribe:async({email})=>{values.push(email);if(++calls===1)throw Error();return {ok:true,status:'subscribed'};}});
  assert.equal((await send(' test@example.invalid ')).status,'error');
  assert.equal((await send(' test@example.invalid ')).status,'subscribed');
  assert.deepEqual(values,['test@example.invalid','test@example.invalid']);
});
