// Coordinates are percentages of the original photograph. Set productId only
// after confirming an exact catalog match. Decorative connectors do not imply catalog bindings.
// image stays null until the exact transparent product cutout is supplied.
export const scenes = [
  {
    id: 'living-room', room: 'Гостиная', collectionUrl: null, position: { x: 65, y: 20 }, image: './assets/inspiration/living-room.png',
    alt: 'Синяя скульптурная ваза с цветущей веткой, персиковая чаша и светлая кружка на деревянном столе в гостиной.',
    description: 'Выразительные акценты для любимого пространства',
    hotspots: [
      { label: 'Ваза «Волна»', description: 'Кобальтовая глазурь и скульптурная форма.', image: null, requiredImage: 'assets/inspiration/products/wave-vase.png', productId: null, point: { x: 39, y: 39 } },
      { label: 'Чаша «Персик»', description: 'Мягкие линии и тёплый оттенок.', image: null, requiredImage: 'assets/inspiration/products/peach-bowl.png', productId: null, point: { x: 62, y: 63 } },
      { label: 'Кружка «Мел»', description: 'Для любимого кофе и неспешных утренних ритуалов.', image: null, requiredImage: 'assets/inspiration/products/chalk-mug.png', productId: null, point: { x: 86, y: 64 } },
    ],
  },
  {
    id: 'kitchen', room: 'Кухня', collectionUrl: null, position: { x: 85, y: 65 }, image: './assets/inspiration/kitchen.png',
    alt: 'Селадоновый чайник, горчичные кружки и светлая посуда с бордовыми мазками на каменном кухонном острове.',
    description: 'Красивые вещи для повседневных ритуалов',
    hotspots: [
      { label: 'Чайник «Селадон»', description: 'Мягкий оттенок и тепло любимых ритуалов.', image: null, requiredImage: 'assets/inspiration/products/celadon-teapot.png', productId: null, point: { x: 53, y: 31 } },
      { label: 'Чашки «Охра»', description: 'Тёплая глазурь для неспешного кофе.', image: null, requiredImage: 'assets/inspiration/products/ochre-cups.png', productId: null, point: { x: 28, y: 60 } },
      { label: 'Посуда «Мазки»', description: 'Выразительная сервировка на каждый день.', image: null, requiredImage: 'assets/inspiration/products/brush-tableware.png', productId: null, point: { x: 78, y: 66 } },
    ],
  },
  {
    id: 'bedroom', room: 'Спальня', collectionUrl: null, position: { x: 50, y: 15 }, image: './assets/inspiration/bedroom.png',
    alt: 'Бордовый витой подсвечник, персиковая ваза с цветами и голубая чаша на деревянной консоли в спальне.',
    description: 'Детали для тихого вечера и времени для себя',
    hotspots: [
      { label: 'Подсвечник «Спираль»', description: 'Глубокая глазурь и выразительный силуэт.', image: null, requiredImage: 'assets/inspiration/products/spiral-candlestick.png', productId: null, point: { x: 39, y: 39 } },
      { label: 'Ваза «Персик»', description: 'Тёплый оттенок и мягкая округлая форма.', image: null, requiredImage: 'assets/inspiration/products/peach-vase.png', productId: null, point: { x: 58, y: 61 } },
      { label: 'Чаша «Волна»', description: 'Для украшений и любимых мелочей.', image: null, requiredImage: 'assets/inspiration/products/wave-bowl.png', productId: null, point: { x: 79, y: 69 } },
    ],
  },
];
