import { integrations } from './integrations.js';
import { isBusinessUrl } from './business-form.js';
import { mountBusinessDialog } from './business-dialog.js';

const settings = integrations.business;
const dialog = mountBusinessDialog(document.querySelector('.business-dialog'), settings);
for (const button of document.querySelectorAll('[data-business-action]')) {
  const intent = button.dataset.businessAction;
  const route = intent === 'catalogue' ? settings.catalogueUrl : settings.projectUrl;
  if (!isBusinessUrl(route)) {
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'business-dialog');
    button.setAttribute('aria-expanded', 'false');
  }
  button.addEventListener('click', () => {
    if (isBusinessUrl(route)) window.location.assign(route);
    else dialog.open(intent, button);
  });
}
