import { advanceGallery, GALLERY_SPEED, panelPose } from './gallery-geometry.js';

export function mountCollectionsGallery(root) {
  const stage = root.querySelector('.terra-gallery-stage');
  const panels = [...root.querySelectorAll('.terra-gallery-panel')];
  const originals = panels.filter((panel) => !panel.hasAttribute('data-gallery-clone'));
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { reduced: motion.matches, documentHidden: doc.hidden };
  let step = 1;
  let width = 1;
  let offset = 2;
  let frame = null;
  let lastTime = null;
  let turns = 0;
  let destroyed = false;
  root.dataset.completedLoops = '0';

  function paint() {
    if (destroyed || state.reduced) return;
    panels.forEach((panel, index) => {
      const pose = panelPose(index, offset, panels.length, step, width);
      panel.style.transform = `translate3d(calc(-50% + ${pose.x}px), -50%, 0) perspective(1600px) rotateY(${pose.angle}deg) scale(${pose.scale})`;
      panel.style.opacity = String(pose.opacity);
    });
  }
  function canRun() { return !state.reduced && !state.documentHidden; }
  function tick(time) {
    frame = null;
    if (destroyed || !canRun()) { lastTime = null; return; }
    const elapsed = lastTime === null ? 0 : Math.max(0, time - lastTime);
    const cycle = originals.length * step;
    offset = advanceGallery(offset, elapsed, cycle, state);
    turns += elapsed * GALLERY_SPEED / (1000 * cycle);
    const completed = String(Math.floor(turns));
    if (root.dataset.completedLoops !== completed) root.dataset.completedLoops = completed;
    lastTime = time;
    paint();
    frame = win.requestAnimationFrame(tick);
  }
  function sync() {
    root.dataset.reduced = String(state.reduced);
    stage.tabIndex = state.reduced ? 0 : -1;
    if (!canRun()) {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    } else if (frame === null && !destroyed) {
      lastTime = null;
      paint();
      frame = win.requestAnimationFrame(tick);
    }
  }
  function measure() {
    const previousStep = step;
    width = stage.clientWidth;
    const style = win.getComputedStyle(originals[0]);
    const gap = parseFloat(win.getComputedStyle(stage).getPropertyValue('--panel-gap'));
    step = parseFloat(style.width) + gap;
    offset = offset / previousStep * step;
    paint();
  }
  function onMotion() {
    state.reduced = motion.matches;
    if (!state.reduced) stage.scrollLeft = 0;
    sync();
  }
  function onVisibility() { state.documentHidden = doc.hidden; sync(); }
  function onPageHide(event) { if (!event.persisted) destroy(); }
  motion.addEventListener('change', onMotion);
  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('pagehide', onPageHide);
  const resize = new win.ResizeObserver(measure);
  resize.observe(stage);
  root.dataset.ready = 'true';
  measure();
  sync();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (frame !== null) win.cancelAnimationFrame(frame);
    resize.disconnect();
    motion.removeEventListener('change', onMotion);
    doc.removeEventListener('visibilitychange', onVisibility);
    win.removeEventListener('pagehide', onPageHide);
    panels.forEach((panel) => { panel.style.removeProperty('transform'); panel.style.removeProperty('opacity'); });
    delete root.dataset.ready;
    delete root.dataset.reduced;
    delete root.dataset.completedLoops;
  }
  return destroy;
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-terra-gallery]').forEach(mountCollectionsGallery);
