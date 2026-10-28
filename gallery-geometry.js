export const wrap = (value, length) => ((value % length) + length) % length;
export const GALLERY_SPEED = 28; // CSS pixels per second along the ribbon.

// The repeated copy occupies exactly the original pose at one sequence length.
export function panelPose(index, offset, count, step, width) {
  const cycle = count * step;
  const distance = wrap(index * step - offset + cycle / 2, cycle) - cycle / 2;
  const normal = distance / (width / 2);
  const mobile = width <= 600;
  const tablet = width <= 1024;
  const bend = tablet ? .035 : .2;
  const x = mobile ? distance : distance / (1 + bend * normal ** 2);
  const strength = mobile ? 18 : tablet ? 36 : 55;
  const limit = mobile ? 24 : tablet ? 45 : 67;
  const scale = 1 + (mobile ? .04 : tablet ? .12 : .22) * Math.min(normal ** 2, 1.8);
  // The tangent follows the compression of the curved path. Compensating for
  // depth keeps the projected panel widths and their gaps consistent at edges.
  const tangent = (1 - bend * normal ** 2) / (1 + bend * normal ** 2) ** 2;
  const tilt = tablet ? Math.min(limit, Math.abs(normal * strength)) : Math.min(78, Math.acos(Math.max(0, Math.min(1, tangent / scale))) * 180 / Math.PI);
  const angle = distance === 0 ? 0 : -Math.sign(distance) * tilt;
  const opacity = Math.max(0, Math.min(1, (1.55 - Math.abs(normal)) / .35));
  return { x, angle, scale, opacity };
}

export function advanceGallery(offset, elapsed, cycle, state) {
  if (state.reduced || state.documentHidden) return offset;
  return wrap(offset + Math.max(0, elapsed) * GALLERY_SPEED / 1000, cycle);
}
