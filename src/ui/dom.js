// Hyperscript helper. Builds DOM nodes with createElement and text nodes only:
// strings are never parsed as markup (safe for user text).

function appendChildren(el, children) {
  for (const child of children) {
    if (Array.isArray(child)) appendChildren(el, child);
    else if (child === null || child === undefined || child === false) continue;
    else if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
}

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, val] of Object.entries(props)) {
      if (val === null || val === undefined) continue;
      if (key === 'class') el.className = val;
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'value' || key === 'checked' || key === 'disabled') {
        el[key] = val;
      } else el.setAttribute(key, val);
    }
  }
  appendChildren(el, children);
  return el;
}

export function mount(container, node) {
  container.replaceChildren(node);
}
