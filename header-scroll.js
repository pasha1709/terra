// Accumulate deliberate travel in one direction, ignoring rubber band overscroll.
export function createHeaderVisibility(initialY = 0) {
  let previous = Math.max(0, initialY);
  let direction = 0;
  let travel = 0;
  let visible = true;
  return (rawY, maxY = Infinity, locked = false) => {
    const y = Math.max(0, Math.min(rawY, Math.max(0, maxY)));
    const delta = y - previous;
    previous = y;
    if (y <= 80 || locked) {
      direction = 0;
      travel = 0;
      visible = true;
    } else if (delta !== 0) {
      const nextDirection = Math.sign(delta);
      if (nextDirection !== direction) travel = 0;
      direction = nextDirection;
      travel += Math.abs(delta);
      if (travel >= 12) visible = direction < 0;
    }
    return visible;
  };
}

export function mountHeaderScroll(header, menuButton) {
  const doc = header.ownerDocument;
  const win = doc.defaultView;
  const update = createHeaderVisibility(win.scrollY);
  let frame = null;
  let destroyed = false;

  function render() {
    frame = null;
    if (destroyed) return;
    const keyboardFocus = header.contains(doc.activeElement) && doc.activeElement.matches(':focus-visible');
    const locked = keyboardFocus || menuButton.getAttribute('aria-expanded') === 'true';
    const visible = update(win.scrollY, doc.documentElement.scrollHeight - win.innerHeight, locked);
    header.dataset.scrollHidden = String(!visible);
  }
  function schedule() {
    if (!destroyed && frame === null) frame = win.requestAnimationFrame(render);
  }
  function showForFocus() {
    if (frame !== null) win.cancelAnimationFrame(frame);
    render();
  }
  function onPageHide(event) {
    // A cached page retains its listeners when restored with browser Back.
    if (!event.persisted) destroy();
  }
  const observer = new win.MutationObserver(schedule);
  observer.observe(menuButton, { attributes: true, attributeFilter: ['aria-expanded'] });
  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', schedule);
  win.addEventListener('pagehide', onPageHide);
  header.addEventListener('focusin', showForFocus);
  header.addEventListener('focusout', schedule);
  render();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (frame !== null) win.cancelAnimationFrame(frame);
    observer.disconnect();
    win.removeEventListener('scroll', schedule);
    win.removeEventListener('resize', schedule);
    win.removeEventListener('pagehide', onPageHide);
    header.removeEventListener('focusin', showForFocus);
    header.removeEventListener('focusout', schedule);
    delete header.dataset.scrollHidden;
  }
  return destroy;
}
