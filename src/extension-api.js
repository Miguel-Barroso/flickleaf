// Shared browser API entry point; no extra polyfill or permissions needed.
export const extension = globalThis.browser ?? globalThis.chrome;
