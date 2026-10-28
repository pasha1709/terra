// Display-only data from the approved mockup, NOT new records in a catalog.
// Map productId to existing records when the real catalog becomes available.
export const oliveCollection = {
  title: 'Олива и мел',
  subtitle: 'Два характера — одно настроение дома.',
  description: 'Оливковая глазурь и светлая глина для\nвыразительных деталей интерьера.',
  // Clean table photograph supplied by the user; transparent cutouts are still required.
  backgroundImage: './assets/olive/collection-table.png',
  backgroundPosition: '100% 50%',
  note: 'Соберите свою пару: для цветов, света и настроения.',
  products: [
    {
      key: 'pitcher-reference', productId: null,
      name: 'Кувшин «Олива»', details: '1,2 л · керамика', price: 7800, currency: 'RUB',
      cutout: null, requiredCutout: 'assets/olive/pitcher-cutout.png',
      image: './assets/olive/pitcher.png', position: '50% 50%',
      alt: 'Оливковый глазурованный керамический кувшин с округлым корпусом и ручкой на светлом каменном постаменте.',
    },
    {
      key: 'arch-reference', productId: null,
      name: 'Подсвечник «Арка»', details: '18 см · керамика', price: 3400, currency: 'RUB',
      cutout: null, requiredCutout: 'assets/olive/arch-cutout.png',
      image: './assets/olive/arch.png', position: '50% 50%',
      alt: 'Светлый фактурный керамический подсвечник в форме арки с тонкой свечой на каменном постаменте.',
    },
  ],
};
