// src/ui/dom.js — minimale DOM-Helfer (kein Framework, build-frei).

/** Erzeugt ein Element. props: {class, text, html, onClick, ...attrs}; children optional. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'onClick') node.addEventListener('click', v);
    else if (k === 'onInput') node.addEventListener('input', v);
    else if (k === 'onChange') node.addEventListener('change', v);
    else if (k === 'onSubmit') node.addEventListener('submit', v);
    else if (k.startsWith('data-') || k === 'role' || k === 'type' || k === 'placeholder'
             || k === 'value' || k === 'href' || k === 'aria-label' || k === 'for' || k === 'id'
             || k === 'name' || k === 'autocomplete' || k === 'minlength' || k === 'disabled')
      node.setAttribute(k, v === true ? '' : v);
    else node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

export function mount(container, node) { clear(container); container.appendChild(node); }

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
