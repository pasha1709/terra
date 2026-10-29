import test from 'node:test';
import assert from 'node:assert/strict';
import { footerDestinations } from '../footer.js';
import { integrations } from '../integrations.js';

test('footer omits missing destinations and rejects placeholder and executable URLs', () => {
  const result = footerDestinations(integrations);
  for (const group of ['catalog', 'atelier', 'contacts']) {
    assert.ok(result[group].every(([, url]) => !result.valid(url)));
  }
  for (const url of ['#', '', 'javascript:alert(1)', '//unknown.example', null]) assert.equal(result.valid(url), null);
  assert.equal(result.policy, null);
  assert.equal(result.valid('/catalog/vases'), '/catalog/vases');
  assert.equal(result.valid('mailto:shop@example.com'), 'mailto:shop@example.com');
  assert.equal(footerDestinations({ newsletter: { privacyUrl: '/privacy' } }).policy, '/privacy');
});
