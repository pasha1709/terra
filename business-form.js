const subjects = { project: 'Обсудим ваш проект', catalogue: 'Запрос коммерческого каталога' };
const types = new Set(['restaurant', 'hotel', 'design', 'other']);
const clean = value => typeof value === 'string' ? value.trim() : '';

export function isBusinessUrl(value) {
  if (!clean(value)) return false;
  try { return ['http:', 'https:'].includes(new URL(value, 'http://localhost').protocol); } catch { return false; }
}
export function validateBusinessForm(values = {}, settings = {}) {
  const name = clean(values.name);
  const contact = clean(values.contact);
  const projectType = clean(values.projectType);
  const description = clean(values.description);
  const intent = values.intent === 'catalogue' ? 'catalogue' : 'project';
  const errors = {};
  if (!name) errors.name = 'Укажите ваше имя.';
  else if (name.length > 100) errors.name = 'Имя должно быть не длиннее 100 символов.';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const digits = contact.replace(/\D/g, '');
  const phone = /^\+?[\d\s().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15;
  if (!contact) errors.contact = 'Укажите email или телефон для связи.';
  else if (contact.length > 254 || (!email && !phone)) errors.contact = 'Проверьте email или номер телефона.';
  if (projectType && !types.has(projectType)) errors.projectType = 'Выберите тип проекта из списка.';
  if (description.length > 2000) errors.description = 'Описание должно быть не длиннее 2000 символов.';
  if (settings.consent?.required && values.consent !== true) errors.consent = 'Подтвердите согласие, чтобы отправить заявку.';
  const payload = { intent, subject: subjects[intent], name, contact, projectType: projectType || null, description };
  if (settings.consent?.label) payload.consent = values.consent === true;
  return { errors, payload };
}
export function isBusinessReady(settings = {}) {
  return typeof settings.submit === 'function' && isBusinessUrl(settings.privacyUrl)
    && (!settings.consent || typeof settings.consent.label === 'string' && !!settings.consent.label.trim());
}
export function createBusinessSender(settings = {}) {
  let pending = false;
  return async (values) => {
    if (pending) return { status: 'busy' };
    const { errors, payload } = validateBusinessForm(values, settings);
    if (Object.keys(errors).length) return { status: 'invalid', errors };
    if (!isBusinessReady(settings)) return { status: 'unavailable' };
    pending = true;
    try {
      const result = await settings.submit(Object.freeze(payload));
      return { status: result?.ok === true ? 'success' : 'error' };
    } catch { return { status: 'error' }; }
    finally { pending = false; }
  };
}
