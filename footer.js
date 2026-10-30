import { integrations } from './integrations.js';

// Missing destinations stay absent; existing anchors also work without JS.
export function footerDestinations(settings) {
  const valid = value => typeof value === 'string' && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|\.\.?\/)/i.test(value.trim()) ? value.trim() : null;
  return {
    catalog: [['Вазы', settings.categoryVases], ['Посуда', settings.categoryTableware], ['Декор', settings.categoryDecor]],
    catalogue: valid(settings.catalog),
    policy: valid(settings.newsletter?.privacyUrl) || valid(settings.business?.privacyUrl),
    valid,
  };
}

export function mountFooter(root, settings = integrations) {
  const destinations = footerDestinations(settings);
  root.querySelector('[data-footer-year]').textContent = String(new Date().getFullYear());
  if (destinations.catalogue) root.querySelector('[data-footer-catalog]').href = destinations.catalogue;
  for (const group of ['catalog']) {
    const list = root.querySelector(`[data-footer-links="${group}"]`);
    for (const [label, destination] of destinations[group]) {
      const href = destinations.valid(destination);
      if (!href) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      item.append(link);
      list.append(item);
    }
    root.querySelector(`[data-footer-column="${group}"]`).hidden = !list.children.length;
  }
  if (destinations.policy) {
    const policy = root.querySelector('[data-footer-policy]');
    policy.href = destinations.policy;
    policy.hidden = false;
  }
  root.querySelector('.footer-to-top').addEventListener('click', event => {
    event.preventDefault();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'instant' : 'smooth' });
  });
  for (const link of root.querySelectorAll('[data-footer-answers]')) {
    link.addEventListener('click', () => {
      for (const id of link.dataset.footerAnswers.split(' ')) {
        const trigger = document.getElementById(id);
        if (trigger?.getAttribute('aria-expanded') === 'false') trigger.click();
      }
    });
  }
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('.site-footer');
  if (root) mountFooter(root);
}
