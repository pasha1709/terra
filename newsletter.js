import { integrations } from './integrations.js';
import { isBusinessUrl } from './business-form.js';
import { createNewsletterSender, newsletterReady, validateNewsletterEmail } from './newsletter-form.js';
export function mountNewsletter(root, settings = {}) {
  const form = root.querySelector('form');
  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const label = button.querySelector('span');
  const error = root.querySelector('[data-newsletter-error]');
  const status = root.querySelector('[data-newsletter-status]');
  const policy = root.querySelector('[data-newsletter-policy]');
  const ready = newsletterReady(settings);
  const send = createNewsletterSender(settings);
  let pending = false;
  let completed = false;
  if (isBusinessUrl(settings.privacyUrl)) { policy.href = settings.privacyUrl; policy.removeAttribute('aria-disabled'); }
  button.disabled = !ready;
  if (!ready) status.textContent = 'Подписка пока недоступна.';
  function showError(message) { error.textContent = message; error.hidden = !message; input.setAttribute('aria-invalid', String(!!message)); }
  input.addEventListener('blur', () => { input.value = input.value.trim(); if (!completed || input.value) showError(validateNewsletterEmail(input.value).error); });
  input.addEventListener('input', () => { completed = false; });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') showError(validateNewsletterEmail(input.value).error); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const checked = validateNewsletterEmail(input.value);
    input.value = checked.email;
    showError(checked.error);
    if (checked.error) { input.focus(); return; }
    if (!ready) return;
    pending = true; button.disabled = true; input.readOnly = true;
    form.setAttribute('aria-busy', 'true'); label.textContent = 'Подписываем…'; status.textContent = '';
    try {
      const result = await send(input.value);
      if (result.status === 'subscribed' || result.status === 'confirmation_required') {
        status.textContent = result.status === 'confirmation_required' ? 'Проверьте почту и подтвердите подписку по ссылке в письме.' : 'Вы подписаны на письма TERRA.';
        input.value = '';
        completed = true;
        showError('');
      } else status.textContent = 'Не удалось оформить подписку. Попробуйте ещё раз — email сохранён в поле.';
    } finally { pending = false; button.disabled = !ready; input.readOnly = false; form.removeAttribute('aria-busy'); label.textContent = 'Подписаться'; }
  });
}
const root = document.querySelector('[data-newsletter]');
if (root) mountNewsletter(root, integrations.newsletter);
