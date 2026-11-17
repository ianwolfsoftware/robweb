import { useEffect, useRef, type ReactNode } from 'react';

export function MotionPage({ path, children }: { path: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return;
    let cancelled = false;
    void import('animejs').then(({ animate }) => {
      if (!cancelled && ref.current) animate(ref.current, { opacity: [0, 1], y: [12, 0], duration: 320, ease: 'out(3)' });
    });
    return () => { cancelled = true; };
  }, [path]);
  return <div ref={ref} data-motion-page>{children}</div>;
}

export function WebglSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
    const target = ref.current;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      void import('./webgl-slot').then(({ mountWebglSlot }) => mountWebglSlot(target)).catch(() => target.dataset.state = 'fallback');
    }, { rootMargin: '160px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="webgl-slot" data-state="static" aria-hidden="true"><span>Measured craft</span></div>;
}
