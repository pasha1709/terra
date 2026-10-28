// No local cart or simulated success: only the connected adapter can confirm add().
export function createCartAction(cart, onCount) {
  const pending = new Set();
  return async (product) => {
    if (!product?.id || product.available !== true || typeof cart?.add !== 'function') return { status: 'unavailable' };
    if (pending.has(product.id)) return { status: 'busy' };
    pending.add(product.id);
    try {
      try { await cart.add(product.id); } catch (error) { return { status: 'error', error }; }
      // A failed count refresh cannot undo an already accepted cart mutation.
      try { onCount(await cart.getCount()); return { status: 'success', countSynced: true }; }
      catch { return { status: 'success', countSynced: false }; }
    } finally { pending.delete(product.id); }
  };
}

export async function resolveCollectionItem(reference, catalog) {
  if (!reference.productId || typeof catalog?.getById !== 'function') {
    return { mode: 'reference', product: { ...reference, id: null, available: false, url: null } };
  }
  try {
    const product = await catalog.getById(reference.productId);
    if (!product || product.id !== reference.productId || typeof product.name !== 'string' || !product.name.trim() || typeof product.details !== 'string' || !Number.isFinite(product.price) || product.price < 0 || typeof product.available !== 'boolean') throw new Error('Invalid catalog product');
    // Reject an invalid currency before exposing an active buy button.
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: product.currency || 'RUB' }).format(product.price);
    return { mode: 'ready', product: { ...reference, ...product } };
  } catch (error) { return { mode: 'error', product: null, error }; }
}
