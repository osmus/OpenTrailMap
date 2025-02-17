
// Creates a new HTML element where certain functions return the element itself.
export function createElement(...args) {
  let el = document.createElement(...args);
  wrapElementFunctions(el);
  return el;
}

// Gets an HTML element where certain functions return the element itself.
export function getElementById(...args) {
  let el = document.getElementById(...args);
  if (el) wrapElementFunctions(el);
  return el;
}

// Wraps certain functions of the element so they return the
// element itself in order to enable chaining.
function wrapElementFunctions(el) {
  let fnNames = ['addEventListener', 'append', 'appendChild', 'replaceChildren', 'setAttribute'];
  for (let i in fnNames) {
    let fnName = fnNames[i];
    let fn = el[fnName];
    el[fnName] = function(...args) {
      fn.apply(this, args);
      return el;
    };
  }
} 