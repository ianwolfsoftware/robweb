import { useEffect, useRef, type ReactNode } from 'react';

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  getBattery?: () => Promise<{ charging: boolean; level: number }>;
};

export function MotionPage({ path, children }: { path: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    document.documentElement.classList.add('motion-ready');
    const cleanups: Array<() => void> = [];
    let cancelled = false;

    void import('animejs').then(({ animate, stagger }) => {
      if (cancelled) return;
      animate(root, { opacity: [0, 1], translateY: [10, 0], duration: 360, ease: 'out(3)' });
      animate(root.querySelectorAll('.hero-line'), { opacity: [0, 1], translateY: [34, 0], delay: stagger(85, { start: 80 }), duration: 720, ease: 'out(4)' });
      animate(root.querySelectorAll('.hero-intro'), { opacity: [0, 1], translateY: [18, 0], delay: stagger(60, { start: 260 }), duration: 560, ease: 'out(3)' });

      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          animate(target, { opacity: [0, 1], translateY: [28, 0], duration: 620, ease: 'out(3)' });
          target.dataset.revealState = 'done';
          revealObserver.unobserve(target);
        });
      }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        element.dataset.revealState = 'watch';
        revealObserver.observe(element);
      });
      cleanups.push(() => revealObserver.disconnect());

      const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const target = Number(element.dataset.count || element.textContent || 0);
          animate(element, {
            innerHTML: [0, target],
            modifier: (value: number) => String(Math.round(value)),
            duration: 1250,
            ease: 'out(4)',
          });
          countObserver.unobserve(element);
        });
      }, { threshold: .7 });
      root.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => countObserver.observe(element));
      cleanups.push(() => countObserver.disconnect());

      const track = root.querySelector<HTMLElement>('.marquee-track');
      if (track) animate(track, { translateX: [0, -(track.scrollWidth / 2)], duration: 42000, ease: 'linear', loop: true });

      root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((button) => {
        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          const box = button.getBoundingClientRect();
          const x = (event.clientX - box.left - box.width / 2) * .13;
          const y = (event.clientY - box.top - box.height / 2) * .16;
          animate(button, { translateX: x, translateY: y, duration: 220, ease: 'out(3)' });
        };
        const leave = () => animate(button, { translateX: 0, translateY: 0, duration: 480, ease: 'out(5)' });
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerleave', leave);
        cleanups.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave); });
      });

      const transition = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
        if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname || url.pathname.startsWith('/go/')) return;
        event.preventDefault();
        animate(root, { opacity: [1, 0], translateY: [0, -8], duration: 180, ease: 'in(2)', onComplete: () => { location.href = url.href; } });
      };
      document.addEventListener('click', transition);
      cleanups.push(() => document.removeEventListener('click', transition));
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      document.documentElement.classList.remove('motion-ready');
    };
  }, [path]);
  return <div ref={ref} data-motion-page>{children}</div>;
}

export function WebglSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let disposed = false;
    let disposeScene: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    let idleId: number | undefined;

    const fallback = (reason: string) => {
      target.dataset.state = 'fallback';
      target.dataset.webglReason = reason;
    };
    const gate = async () => {
      const hints = navigator as NavigatorWithHints;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';
      if (hints.connection?.saveData) return 'save-data';
      if (hints.deviceMemory && hints.deviceMemory <= 2) return 'low-memory';
      if (hints.hardwareConcurrency && hints.hardwareConcurrency <= 2) return 'low-cpu';
      try {
        const battery = await hints.getBattery?.();
        if (battery && !battery.charging && battery.level <= .2) return 'low-battery';
      } catch { /* Battery status is optional. */ }
      const probe = document.createElement('canvas');
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return 'no-webgl';
      return null;
    };
    const boot = async () => {
      const reason = await gate();
      if (disposed) return;
      if (reason) return fallback(reason);
      target.dataset.state = 'loading';
      observer = new IntersectionObserver((entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer?.disconnect();
        void import('./webgl-slot').then(({ mountWebglSlot }) => {
          if (!disposed) disposeScene = mountWebglSlot(target);
        }).catch(() => fallback('load-error'));
      }, { rootMargin: '180px' });
      observer.observe(target);
    };
    const idle = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (idle.requestIdleCallback) idleId = idle.requestIdleCallback(() => { void boot(); }, { timeout: 900 });
    else idleId = window.setTimeout(() => { void boot(); }, 80);
    return () => {
      disposed = true;
      observer?.disconnect();
      disposeScene?.();
      if (idleId !== undefined) {
        if (idle.cancelIdleCallback) idle.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
    };
  }, []);
  return <div ref={ref} className="webgl-slot" data-state="static" aria-hidden="true"><span>Optional WebGL · static fallback ready</span></div>;
}
