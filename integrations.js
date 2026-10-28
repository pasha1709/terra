// Set real routes and provide the store's cart adapter when those features exist.
// No local or simulated cart is created by this presentation layer.
export const integrations = {
  catalog: null,
  newArrivals: null,
  atelier: null,
  delivery: null,
  search: null,
  // Real support channel URL (https:, mailto: or tel:), once provided by the store.
  contact: null,
  // subscribe({ email }) must validate on the server and return
  // { ok: true, status: 'subscribed' | 'confirmation_required' } after acceptance.
  newsletter: { privacyUrl: null, subscribe: null },
  // Set only actual store routes and its approved request handler.
  // submit(payload) must resolve to { ok: true } only after server acceptance.
  business: {
    projectUrl: null,
    catalogueUrl: null,
    privacyUrl: null,
    consent: null, // Optional existing mechanism: { label, required: true }.
    submit: null,
  },
  // Category routes do not exist yet. Replace null with real catalog URLs.
  categoryVases: null,
  categoryTableware: null,
  categoryTeaCoffee: null,
  categoryDecor: null,
  // Optional collection URL and catalog adapter: { async getById(id) }.
  // Records must contain { id, name, price: number, currency, url }.
  inspirationCollection: null,
  oliveCollection: null,
  products: null,
  // Cart adapter: { open(), add(productId), getCount(), subscribe(callback) }.
  // add() must resolve only after the real cart has accepted the product.
  cart: null,
  // User-supplied full-width composition, including the lavender text area.
  heroImage: './assets/terra-hero-wide.png',
  // Preserve the existing product-card thumbnail independently of the wide hero.
  productImage: './assets/terra-hero.png',
};
