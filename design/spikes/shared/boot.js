const root = document.querySelector('[data-webgl]');

function useFallback(reason) {
  document.documentElement.dataset.webglState = 'fallback';
  document.documentElement.dataset.webglReason = reason;
  window.__ROBWEB_PERF__ = { mode: 'fallback', reason, samples: 0 };
}

async function shouldFallBack() {
  if (!root) return 'missing-root';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';
  if (navigator.connection?.saveData) return 'save-data';
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return 'low-memory';
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return 'low-cpu';

  try {
    const battery = await navigator.getBattery?.();
    if (battery && !battery.charging && battery.level <= 0.2) return 'low-battery';
  } catch {
    // Battery status is not consistently exposed. Absence is not a failure.
  }

  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return 'no-webgl';
  return null;
}

async function boot() {
  const reason = await shouldFallBack();
  if (reason) return useFallback(reason);

  try {
    const moduleUrl = new URL(root.dataset.module, document.baseURI);
    const scene = await import(moduleUrl);
    await scene.mount(root);
    document.documentElement.dataset.webglState = 'ready';
  } catch (error) {
    console.warn('Optional Robweb WebGL layer failed; using static art.', error);
    useFallback('load-error');
  }
}

document.documentElement.dataset.webglState = 'loading';
if ('requestIdleCallback' in window) {
  requestIdleCallback(boot, { timeout: 900 });
} else {
  setTimeout(boot, 80);
}
