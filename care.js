import { integrations } from './integrations.js';
import { careQuestions } from './care-data.js';
import { mountAccordion } from './accordion.js';

for (const root of document.querySelectorAll('[data-care-accordion]')) {
  const items = careQuestions.filter(item => item.group === root.dataset.careAccordion);
  mountAccordion(root, items, root.dataset.careAccordion === 'order' ? 'order' : null, integrations.contact);
}

const contact = document.querySelector('[data-care-contact]');
if (typeof integrations.contact === 'string' && integrations.contact.trim()) {
  contact.href = integrations.contact;
  contact.removeAttribute('aria-disabled');
  contact.removeAttribute('role');
}
