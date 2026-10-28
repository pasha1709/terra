import { scenes } from './scenes.js';
import { createSceneTimeline, SCENE_TRANSITION } from './scene-timeline.js';

export function mountInteriorSlider(root) {
  const doc = root.ownerDocument, win = doc.defaultView;
  const viewport = root.querySelector('[data-scenes]');
  const products = root.querySelector('[data-life-products]');
  const rooms = root.querySelector('[data-life-rooms]');
  const progress = root.querySelector('[data-life-progress]');
  const pause = root.querySelector('[data-life-pause]');
  const status = root.querySelector('[data-life-status]');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController(), options = { signal: events.signal };
  const on = (node, event, fn, extra = {}) => node.addEventListener(event, fn, { ...options, ...extra });
  let activeSlide = 0, generation = 0, animations = [], destroyed = false;
  let userPaused = false, swipe = null, automaticChanges = 0;
  const buttons = [], indicators = [], frames = [];

  for (const [index, scene] of scenes.entries()) {
    const room = doc.createElement('button'); room.type = 'button'; room.className = 'life-room';
    const number = doc.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
    room.append(number, scene.room); room.setAttribute('aria-controls', `life-scene-${scene.id}`);
    rooms.append(room); buttons.push(room);
    const indicator = doc.createElement('button'); indicator.type = 'button'; indicator.className = 'life-indicator';
    indicator.setAttribute('aria-label', `Показать: ${scene.room}`);
    indicator.setAttribute('aria-controls', `life-scene-${scene.id}`);
    progress.append(indicator); indicators.push(indicator);

    const figure = doc.createElement('figure'); figure.id = `life-scene-${scene.id}`; figure.className = 'life-scene';
    figure.setAttribute('role', 'group'); figure.setAttribute('aria-roledescription', 'слайд');
    figure.setAttribute('aria-label', `${index + 1} из 3: ${scene.room}`);
    const image = doc.createElement('img'); image.src = scene.image; image.alt = scene.alt;
    image.width = 1672; image.height = 941; image.decoding = 'async'; image.draggable = false;
    image.loading = 'eager'; image.fetchPriority = index === 0 ? 'auto' : 'low';
    figure.style.setProperty('--scene-position', `${scene.position.x}% ${scene.position.y}%`);
    figure.append(image); viewport.append(figure);

    const productScene = doc.createElement('div'); productScene.className = 'life-product-scene';
    productScene.dataset.productScene = scene.id;
    for (const product of scene.hotspots) {
      const row = doc.createElement('article'); row.className = 'life-product-row';
      const title = doc.createElement('h3'); title.textContent = product.label;
      const description = doc.createElement('p'); description.textContent = product.description;
      row.append(title, description); productScene.append(row);
    }
    products.append(productScene); frames.push({figure, productScene});
  }
  function playback() {
    const blocked = userPaused || doc.hidden;
    animations.forEach(animation => blocked ? animation.pause() : animation.play());
    root.dataset.paused = String(blocked || motion.matches);
  }
  function settle() {
    animations.forEach(animation => animation.cancel()); animations = [];
    frames.forEach(({figure, productScene}, index) => {
      const inactive = index !== activeSlide;
      for (const layer of [figure, productScene]) {
        layer.hidden = inactive; layer.inert = inactive;
        layer.setAttribute('aria-hidden', String(inactive)); layer.style.zIndex = '';
      }
    });
    root.dataset.transitioning = 'false';
  }
  function selection() {
    root.dataset.activeSlide = String(activeSlide);
    root.dataset.activeScene = scenes[activeSlide].id;
    buttons.forEach((button, index) => button.setAttribute('aria-current', String(index === activeSlide)));
    indicators.forEach((button, index) => {
      button.setAttribute('aria-current', String(index === activeSlide));
      button.style.setProperty('--progress', '0');
    });
  }
  function show(index, manual) {
    const token = ++generation, previous = activeSlide;
    settle(); activeSlide = index; selection();
    if (manual) status.textContent = `${index + 1} из 3. ${scenes[index].room}`;
    else root.dataset.automaticChanges = String(++automaticChanges);
    if (previous === index || motion.matches || (manual && userPaused)) { settle(); clock.ready(); return; }
    root.dataset.transitioning = 'true';
    const incoming = frames[index], outgoing = frames[previous];
    for (const layer of [incoming.figure, incoming.productScene]) {
      layer.hidden = false; layer.inert = false; layer.setAttribute('aria-hidden', 'false'); layer.style.zIndex = '1';
    }
    for (const layer of [outgoing.figure, outgoing.productScene]) {
      layer.inert = true; layer.setAttribute('aria-hidden', 'true'); layer.style.zIndex = '0';
    }
    const settings = {duration: SCENE_TRANSITION, easing: 'ease-in-out', fill: 'both'};
    // An opaque outgoing photograph avoids a dark dip halfway through the fade.
    animations = [
      incoming.figure.animate([{opacity: 0}, {opacity: 1}], settings),
      incoming.productScene.animate([{opacity: 0}, {opacity: 1}], settings),
      outgoing.productScene.animate([{opacity: 1}, {opacity: 0}], settings),
    ];
    playback();
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (destroyed || generation !== token) return;
      settle(); clock.ready();
    }).catch(() => {});
  }
  const clock = createSceneTimeline({
    requestFrame: fn => win.requestAnimationFrame(fn), cancelFrame: id => win.cancelAnimationFrame(id),
    onChange: show, onProgress: value => indicators[activeSlide].style.setProperty('--progress', String(value)),
  });
  selection(); settle(); root.dataset.automaticChanges = '0';
  buttons.forEach((button, index) => on(button, 'click', () => clock.select(index)));
  indicators.forEach((button, index) => on(button, 'click', () => clock.select(index)));
  on(pause, 'click', () => {
    userPaused = !userPaused; clock.block('user', userPaused);
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.setAttribute('aria-label', userPaused ? 'Возобновить автопереключение' : 'Приостановить автопереключение');
    pause.firstElementChild.textContent = userPaused ? '▷' : 'Ⅱ'; playback();
  });
  on(root, 'keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); clock.select(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
  });
  on(viewport, 'pointerdown', event => {
    swipe = {x: event.clientX, y: event.clientY, id: event.pointerId}; clock.block('swipe', true);
  }, {passive: true});
  function endSwipe(event) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    if (event.type !== 'pointercancel' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) clock.select(activeSlide + (dx < 0 ? 1 : -1));
    swipe = null; clock.block('swipe', false);
  }
  on(win, 'pointerup', endSwipe, {passive: true}); on(win, 'pointercancel', endSwipe, {passive: true});
  on(doc, 'visibilitychange', () => { clock.block('hidden', doc.hidden); playback(); });
  clock.block('hidden', doc.hidden);
  function reduced() {
    clock.block('reduced', motion.matches); pause.hidden = motion.matches;
    if (motion.matches) { ++generation; settle(); clock.ready(); }
    playback();
  }
  on(motion, 'change', reduced); reduced(); clock.block('outside', false);
  function destroy() {
    if (destroyed) return;
    destroyed = true; ++generation; clock.destroy(); animations.forEach(animation => animation.cancel());
    events.abort();
  }
  on(win, 'pagehide', event => { if (!event.persisted) destroy(); });
  return destroy;
}
if (typeof document !== 'undefined') document.querySelectorAll('.life-section').forEach(mountInteriorSlider);
