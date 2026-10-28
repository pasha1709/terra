import { createAccordionState } from './accordion-state.js';

// Plain-text content only. Unwritten answers stay closed and unavailable.
export function mountAccordion(root, items, initialOpenId = items[0]?.id, contactUrl = null) {
  const state = createAccordionState(items, initialOpenId);
  const entries = [];
  const fragment = document.createDocumentFragment();
  const prefix = root.id;

  for (const item of items) {
    const article = document.createElement('div');
    article.className = 'care-question';
    const heading = document.createElement('h4');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'care-trigger';
    button.id = `${prefix}-${item.id}-trigger`;
    button.setAttribute('aria-controls', `${prefix}-${item.id}-answer`);
    button.disabled = !state.isAvailable(item.id);
    const label = document.createElement('span');
    label.textContent = item.question;
    const mark = document.createElement('span');
    mark.className = 'care-mark';
    mark.setAttribute('aria-hidden', 'true');
    button.append(label, mark);
    heading.append(button);

    const panel = document.createElement('div');
    panel.className = 'care-answer';
    panel.id = `${prefix}-${item.id}-answer`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);
    const inner = document.createElement('div');
    inner.className = 'care-answer-inner';
    const copy = document.createElement('div');
    copy.className = 'care-answer-copy';
    if (state.isAvailable(item.id)) {
      for (const paragraph of item.answer.trim().split(/\n\s*\n/)) {
        const text = document.createElement('p');
        // Never turn approved plain text into HTML or invent a support destination.
        if (typeof contactUrl === 'string' && /^(https?:|mailto:|tel:|\/(?!\/))/i.test(contactUrl.trim())) {
          for (const part of paragraph.split(/([Нн]апишите нам)/g)) {
            if (/^[Нн]апишите нам$/.test(part)) {
              const link = document.createElement('a');
              link.className = 'care-answer-contact';
              link.href = contactUrl.trim();
              link.textContent = part;
              text.append(link);
            } else text.append(document.createTextNode(part));
          }
        } else text.textContent = paragraph;
        copy.append(text);
      }
    }
    inner.append(copy);
    panel.append(inner);
    article.append(heading, panel);
    fragment.append(article);
    entries.push({ id: item.id, article, button, panel });
    button.addEventListener('click', () => {
      state.toggle(item.id);
      renderState();
    });
  }

  function renderState() {
    for (const { id, article, button, panel } of entries) {
      const open = state.isOpen(id);
      article.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.inert = !open;
    }
  }
  renderState();
  root.replaceChildren(fragment);
  return state;
}
