
// Creates a new HTML element but wraps certain function so they return the
// element itself in order to enable chaining.
export function createElement(...args) {
  let el = document.createElement(...args)
  let fnNames = ['setAttribute', 'addEventListener', 'append', 'appendChild'];
  for (let i in fnNames) {
    let fnName = fnNames[i];
    let fn = el[fnName];
    el[fnName] = function(...args) {
      fn.apply(this, args);
      return el;
    };
  }
  return el;
}