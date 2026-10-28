import { integrations } from './integrations.js';
import { mountHeaderScroll } from './header-scroll.js';

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
mountHeaderScroll(document.querySelector('.site-header'), menuButton);
const dialog = document.querySelector('.availability-dialog');
const announcement = document.querySelector('[data-announcement]');
const cartButton = document.querySelector('.cart-button');
const addButton = document.querySelector('.add-button');
const messages = {
  catalog: 'Каталог пока недоступен. Мы готовим коллекцию к открытию.',
  newArrivals: 'Новая коллекция скоро появится в магазине.',
  atelier: 'Рассказ о мастерской скоро появится здесь.',
  delivery: 'Условия доставки будут опубликованы к открытию магазина.',
  search: 'Поиск будет доступен после открытия каталога.',
  cart: 'Покупка пока недоступна. Корзина ещё не подключена.',
  categoryVases: 'Категория «Вазы и объекты» пока недоступна. Мы готовим каталог к открытию.',
  categoryTableware: 'Категория «Посуда и сервировка» пока недоступна. Мы готовим каталог к открытию.',
  categoryTeaCoffee: 'Категория «Чай и кофе» пока недоступна. Мы готовим каталог к открытию.',
  categoryDecor: 'Категория «Декор и ароматы» пока недоступна. Мы готовим каталог к открытию.',
};

function setMenu(open) {
  mobileNav.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dialog.open && !mobileNav.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
const desktop = window.matchMedia('(min-width: 1200px)');
desktop.addEventListener('change', ({ matches }) => { if (matches) setMenu(false); });

function showUnavailable(destination) {
  document.querySelector('#availability-description').textContent = messages[destination];
  if (!dialog.open) dialog.showModal();
}

document.querySelectorAll('[data-destination]').forEach((element) => {
  const destination = element.dataset.destination;
  const connection = integrations[destination];
  if (element.tagName === 'A') {
    if (typeof connection === 'string' && connection) {
      element.href = connection;
    } else {
      element.setAttribute('role', 'link');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-disabled', 'true');
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); showUnavailable(destination); }
      });
    }
  }
  if (!connection) element.setAttribute('aria-disabled', 'true');
  element.addEventListener('click', () => {
    if (!connection) showUnavailable(destination);
    else if (destination === 'cart') connection.open();
    else if (element.tagName === 'BUTTON') window.location.assign(connection);
  });
});

export function updateCartCount(count) {
  const value = Math.max(0, Math.trunc(Number(count) || 0));
  document.querySelectorAll('[data-cart-count], .mobile-cart-count').forEach((node) => { node.textContent = value; });
  cartButton.setAttribute('aria-label', `Открыть корзину, количество товаров: ${value}`);
}
if (integrations.cart) {
  addButton.removeAttribute('aria-describedby');
  document.querySelector('#cart-integration-note').hidden = true;
  updateCartCount(integrations.cart.getCount());
  integrations.cart.subscribe(updateCartCount);
} else {
  addButton.setAttribute('aria-disabled', 'true');
}
addButton.addEventListener('click', async () => {
  if (!integrations.cart) { showUnavailable('cart'); return; }
  addButton.disabled = true;
  try {
    await integrations.cart.add('forma-04');
    updateCartCount(integrations.cart.getCount());
    announcement.textContent = 'Ваза Forma 04 добавлена в корзину.';
  } catch {
    announcement.textContent = 'Не удалось добавить товар. Попробуйте ещё раз.';
  } finally {
    addButton.disabled = false;
  }
});

function connectImage(image, placeholder, source, thumbnail = false) {
  if (!source) return;
  image.addEventListener('load', () => { image.hidden = false; placeholder.hidden = true; });
  image.addEventListener('error', () => { image.hidden = true; placeholder.hidden = false; });
  if (thumbnail && !integrations.productImage) {
    image.style.objectPosition = '30% 65%';
    image.style.transform = 'scale(1.7)';
    image.style.transformOrigin = '8% 50%';
  }
  image.src = source;
}
connectImage(document.querySelector('[data-hero-image]'), document.querySelector('[data-photo-placeholder]'), integrations.heroImage);
connectImage(document.querySelector('[data-product-image]'), document.querySelector('[data-thumbnail-placeholder]'), integrations.productImage || integrations.heroImage, true);
