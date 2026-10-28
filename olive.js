import { integrations } from './integrations.js';
import { oliveCollection } from './olive-data.js';
import { resolveCollectionItem } from './olive-commerce.js';

const banner = document.querySelector('[data-olive-banner]');
const strip = banner.querySelector('[data-olive-products]');
banner.querySelector('[data-olive-title]').textContent = oliveCollection.title;
banner.querySelector('[data-olive-subtitle]').textContent = oliveCollection.subtitle;
banner.querySelector('[data-olive-description]').textContent = oliveCollection.description;

function isWebUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try { return ['http:', 'https:'].includes(new URL(value, location.href).protocol); } catch { return false; }
}
function bindLink(link, url, message) {
  if (isWebUrl(url)) {
    link.href = url;
    link.removeAttribute('role'); link.removeAttribute('tabindex'); link.removeAttribute('aria-disabled');
  } else {
    link.removeAttribute('href'); link.setAttribute('role','link'); link.setAttribute('tabindex','0'); link.setAttribute('aria-disabled','true');
  }
  if (link.dataset.bound) return;
  link.dataset.bound = 'true';
  const unavailable = event => {
    if (link.hasAttribute('href')) return;
    event.preventDefault();
    document.querySelector('#availability-description').textContent = message;
    const dialog = document.querySelector('.availability-dialog');
    if (!dialog.open) dialog.showModal();
  };
  link.addEventListener('click',unavailable);
  link.addEventListener('keydown',event => { if (event.key === 'Enter') unavailable(event); });
}

// Never use a layout screenshot, a different room or an opaque product photo
// as a substitute for the requested clean source assets.
const background = banner.querySelector('[data-olive-background]');
const photo = banner.querySelector('[data-olive-background-image]');
if (isWebUrl(oliveCollection.backgroundImage)) {
  background.hidden = false; // Reserve the mobile photo area before the request completes.
  photo.style.objectPosition = oliveCollection.backgroundPosition;
  photo.addEventListener('load', () => { photo.hidden = false; banner.dataset.photoReady = 'true'; });
  photo.addEventListener('error', () => { photo.hidden = true; delete banner.dataset.photoReady; });
  photo.src = oliveCollection.backgroundImage;
}

for (const reference of oliveCollection.products) {
  const link = document.createElement('a'); link.className = 'olive-item-link';
  const name = document.createElement('span'); name.textContent = reference.name;
  if (isWebUrl(reference.cutout)) {
    const image = document.createElement('img'); image.src = reference.cutout; image.alt = '';
    image.width = 88; image.height = 96; image.loading = 'lazy'; image.decoding = 'async'; link.append(image);
  }
  const arrow = document.createElementNS('http://www.w3.org/2000/svg','svg');
  arrow.setAttribute('class','arrow'); arrow.setAttribute('aria-hidden','true');
  const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','#arrow'); arrow.append(use);
  link.append(name,arrow); strip.append(link);
  bindLink(link,null,'Страница этого товара пока не опубликована.');
  resolveCollectionItem(reference,integrations.products).then(state => {
    if (state.mode !== 'ready') return;
    name.textContent = state.product.name;
    bindLink(link,state.product.url,'Страница этого товара пока не опубликована.');
  });
}
bindLink(banner.querySelector('.olive-collection-link'),integrations.oliveCollection,'Страница коллекции «Олива и мел» пока не опубликована.');
