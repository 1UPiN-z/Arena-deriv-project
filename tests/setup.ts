import 'fake-indexeddb/auto';

// jsdom polyfills for layout/observer APIs used by the UI layer
class ObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}
(globalThis as unknown as Record<string, unknown>).IntersectionObserver = ObserverStub;
(globalThis as unknown as Record<string, unknown>).ResizeObserver = ObserverStub;
window.scrollTo = (() => undefined) as typeof window.scrollTo;

// AudioContext stub (used by sound notifications)
(globalThis as unknown as Record<string, unknown>).AudioContext ??= class {
  createOscillator() {
    return { connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' };
  }
  createGain() {
    return { connect() {}, gain: { value: 0 } };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
};
