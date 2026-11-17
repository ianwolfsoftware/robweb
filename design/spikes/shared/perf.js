export function createFrameMeter(scene) {
  let previous = 0;
  const intervals = [];

  window.__ROBWEB_PERF__ = { scene, mode: 'webgl', samples: 0 };

  return function markFrame(now, renderer) {
    if (previous) {
      const interval = now - previous;
      if (interval < 250) intervals.push(interval);
      if (intervals.length > 240) intervals.shift();
    }
    previous = now;

    if (intervals.length && intervals.length % 15 === 0) {
      const sorted = [...intervals].sort((a, b) => a - b);
      const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      window.__ROBWEB_PERF__ = {
        scene,
        mode: 'webgl',
        samples: intervals.length,
        averageFrameMs: Number(average.toFixed(2)),
        p95FrameMs: Number(sorted[Math.floor((sorted.length - 1) * .95)].toFixed(2)),
        longFrames: intervals.filter((value) => value > 25).length,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        pixelRatio: renderer.getPixelRatio()
      };
    }
  };
}

export function sizeRenderer(renderer, camera, root, { perspective = false } = {}) {
  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(width, height, false);
  if (perspective) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  return { width, height };
}

export function createVisibilityLoop(root, render) {
  let inView = true;
  let raf = 0;

  const tick = (now) => {
    raf = 0;
    if (!inView || document.hidden) return;
    render(now);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!raf && inView && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) start(); else stop();
  }, { rootMargin: '80px' });
  observer.observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
  start();

  return () => {
    stop();
    observer.disconnect();
  };
}
