export function createAccordionState(items, initialOpenId = null) {
  const available = new Set(items.filter(({ answer }) => typeof answer === 'string' && answer.trim()).map(({ id }) => id));
  let openId = available.has(initialOpenId) ? initialOpenId : null;
  return {
    get openId() { return openId; },
    isAvailable(id) { return available.has(id); },
    isOpen(id) { return openId === id; },
    toggle(id) {
      if (available.has(id)) openId = openId === id ? null : id;
    },
  };
}
