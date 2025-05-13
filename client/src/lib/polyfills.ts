// Polyfills for browser environment
window.global = window;

// Buffer polyfill
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    isBuffer: () => false,
  } as any;
}

// Process polyfill for browser environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
  } as any;
}