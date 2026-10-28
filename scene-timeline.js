export const SCENE_DURATION = 4000;
export const SCENE_TRANSITION = 700;
export function createSceneTimeline({ requestFrame, cancelFrame, onChange, onProgress }) {
  const blocks = new Set(['outside']);
  let index = 0, elapsed = 0, last = null, frame = null, destroyed = false;
  function reset() { elapsed = 0; last = null; onProgress(0); }
  function sync() {
    if (destroyed) return;
    if (blocks.size) { if (frame !== null) cancelFrame(frame); frame = null; }
    else if (frame === null) frame = requestFrame(tick);
  }
  function tick(time) {
    frame = null;
    if (destroyed || blocks.size) return;
    if (last !== null) elapsed += Math.max(0, time - last);
    last = time; onProgress(Math.min(1, elapsed / SCENE_DURATION));
    if (elapsed >= SCENE_DURATION) select((index + 1) % 3, false); else sync();
  }
  function select(next, manual = true) {
    if (destroyed) return;
    index = ((next % 3) + 3) % 3;
    blocks.add('transition'); reset(); sync(); onChange(index, manual);
  }
  return {
    select,
    block(reason, blocked) {
      if (destroyed || blocked === blocks.has(reason)) return;
      if (blocked) blocks.add(reason); else blocks.delete(reason);
      // Pause without losing the elapsed time or the visible progress.
      last = null; sync();
    },
    ready() { if (!destroyed) { blocks.delete('transition'); reset(); sync(); } },
    destroy() { destroyed = true; if (frame !== null) cancelFrame(frame); frame = null; blocks.clear(); },
    get index() { return index; },
  };
}
export function validSceneProduct(id, product) {
  if (!id || !product || product.id !== id || typeof product.name !== 'string' || !product.name.trim() || !Number.isFinite(product.price) || product.price < 0 || typeof product.url !== 'string' || !product.url.trim()) return false;
  try { return ['http:', 'https:'].includes(new URL(product.url, 'https://terra.invalid').protocol); } catch { return false; }
}
