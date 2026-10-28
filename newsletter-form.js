import { isBusinessUrl } from './business-form.js';
export function validateNewsletterEmail(value) {
  const email = typeof value === 'string' ? value.trim() : '';
  return { email, error: !email ? 'Укажите ваш email.' : email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Проверьте адрес электронной почты.' : '' };
}
export function newsletterReady(settings = {}) { return typeof settings.subscribe === 'function' && isBusinessUrl(settings.privacyUrl); }
export function createNewsletterSender(settings = {}) {
  let pending = false;
  return async value => {
    if (pending) return { status: 'busy' };
    const { email, error } = validateNewsletterEmail(value);
    if (error) return { status: 'invalid', error };
    if (!newsletterReady(settings)) return { status: 'unavailable' };
    pending = true;
    try {
      const result = await settings.subscribe({ email });
      if (result?.ok !== true) return { status: 'error' };
      if (result.status === 'confirmation_required') return { status: 'confirmation_required' };
      return { status: result.status === 'subscribed' ? 'subscribed' : 'error' };
    } catch { return { status: 'error' }; }
    finally { pending = false; }
  };
}
