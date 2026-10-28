import { createBusinessSender, isBusinessReady, isBusinessUrl, validateBusinessForm } from './business-form.js';

export function mountBusinessDialog(dialog, settings = {}) {
  const form = dialog.querySelector('form');
  const fields = form.querySelector('fieldset');
  const submit = form.querySelector('[type="submit"]');
  const title = dialog.querySelector('[data-business-dialog-title]');
  const status = form.querySelector('[data-business-status]');
  const privacy = form.querySelector('[data-business-privacy]');
  const consentWrap = form.querySelector('[data-business-consent]');
  const controls = Object.fromEntries(['name', 'contact', 'projectType', 'description', 'consent'].map(name => [name, form.elements.namedItem(name)]));
  const send = createBusinessSender(settings);
  const ready = isBusinessReady(settings);
  let intent = 'project';
  let opener;
  let pending = false;
  if (isBusinessUrl(settings.privacyUrl)) { privacy.href = settings.privacyUrl; privacy.hidden = false; }
  if (typeof settings.consent?.label === 'string' && settings.consent.label.trim()) {
    consentWrap.hidden = false;
    consentWrap.querySelector('[data-consent-label]').textContent = settings.consent.label;
    controls.consent.required = !!settings.consent.required;
  }
  function showAvailability() {
    submit.disabled = !ready;
    status.textContent = ready ? '' : 'Приём заявок пока недоступен.';
  }
  showAvailability();
  function values() {
    return { intent, ...Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.type === 'checkbox' ? control.checked : control.value])) };
  }
  function showError(key, message) {
    const error = form.querySelector(`[data-error="${key}"]`);
    error.textContent = message || '';
    error.hidden = !message;
    controls[key].setAttribute('aria-invalid', String(!!message));
  }
  for (const [key, control] of Object.entries(controls)) {
    control.addEventListener('blur', () => showError(key, validateBusinessForm(values(), settings).errors[key]));
    control.addEventListener('input', () => {
      if (control.getAttribute('aria-invalid') === 'true') showError(key, validateBusinessForm(values(), settings).errors[key]);
    });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const snapshot = values();
    const { errors } = validateBusinessForm(snapshot, settings);
    for (const key of Object.keys(controls)) showError(key, errors[key]);
    if (Object.keys(errors).length) { controls[Object.keys(errors)[0]].focus(); return; }
    if (!ready) { showAvailability(); return; }
    pending = true;
    fields.disabled = true;
    submit.disabled = true;
    dialog.querySelector('[data-business-close]').focus({ preventScroll: true });
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Отправляем…';
    status.textContent = '';
    try {
      const result = await send(snapshot);
      if (result.status === 'success') {
        form.reset();
        status.textContent = 'Заявка отправлена.';
        const announcement = document.querySelector('[data-announcement]');
        if (announcement) announcement.textContent = status.textContent;
      } else {
        status.textContent = 'Не удалось отправить заявку. Ваши данные сохранены в форме. Попробуйте ещё раз.';
      }
    } finally {
      pending = false;
      fields.disabled = false;
      submit.disabled = !ready;
      submit.textContent = 'Отправить заявку';
      form.removeAttribute('aria-busy');
    }
  });
  dialog.querySelector('[data-business-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')]
      .filter(element => element.getClientRects().length && !element.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('close', () => {
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus({ preventScroll: true });
  });
  return {
    open(nextIntent, trigger) {
      opener = trigger;
      if (!pending) {
        intent = nextIntent === 'catalogue' ? 'catalogue' : 'project';
        title.textContent = intent === 'catalogue' ? 'Запрос коммерческого каталога' : 'Обсудим ваш проект';
        showAvailability();
      }
      if (!dialog.open) dialog.showModal();
      trigger.setAttribute('aria-expanded', 'true');
      (pending ? dialog.querySelector('[data-business-close]') : controls.name).focus();
    },
  };
}
