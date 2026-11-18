import { useEffect, useRef, type ReactNode } from 'react';

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  getBattery?: () => Promise<{ charging: boolean; level: number }>;
};

type MotionRuntime = {
  gsap: typeof import('gsap')['gsap'];
  ScrollTrigger: typeof import('gsap/ScrollTrigger')['ScrollTrigger'];
  SplitText: typeof import('gsap/SplitText')['SplitText'];
  Lenis: typeof import('lenis')['default'];
};

const timings = {
  quick: .24,
  normal: .62,
  staggerCharacters: .018,
  staggerContent: .06,
  ease: 'power4.out',
  easeInOut: 'expo.inOut',
} as const;

let runtimePromise: Promise<MotionRuntime> | undefined;

function loadMotionRuntime() {
  runtimePromise ??= Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
    import('lenis'),
  ]).then(([gsapModule, scrollModule, splitModule, lenisModule]) => {
    const runtime = {
      gsap: gsapModule.gsap,
      ScrollTrigger: scrollModule.ScrollTrigger,
      SplitText: splitModule.SplitText,
      Lenis: lenisModule.default,
    };
    runtime.gsap.registerPlugin(runtime.ScrollTrigger, runtime.SplitText);
    return runtime;
  });
  return runtimePromise;
}

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function compactMotionDisabled() {
  const hints = navigator as NavigatorWithHints;
  return Boolean(
    hints.connection?.saveData
    || (hints.deviceMemory && hints.deviceMemory <= 2)
    || (hints.hardwareConcurrency && hints.hardwareConcurrency <= 2),
  );
}

function mountCompactMotion(root: HTMLElement) {
  const html = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-motion-loader]');
  if (loader) loader.dataset.motionLoader = 'done';
  html.classList.add('motion-compact');

  if (compactMotionDisabled()) {
    html.classList.add('motion-compact-static');
    root.dataset.phoneMotion = 'static';
    return () => {
      delete root.dataset.phoneMotion;
      html.classList.remove('motion-compact', 'motion-compact-static');
    };
  }

  html.classList.add('motion-compact-ready');
  root.dataset.phoneMotion = 'ready';
  const cleanups: Array<() => void> = [];

  const revealElements = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      element.dataset.phoneRevealState = 'done';
      revealObserver.unobserve(element);
    });
  }, { rootMargin: '0px 0px -11% 0px', threshold: .08 });
  revealElements.forEach((element, index) => {
    element.style.setProperty('--phone-reveal-delay', `${(index % 4) * 55}ms`);
    if (element.getBoundingClientRect().top < innerHeight * .88) element.dataset.phoneRevealState = 'done';
    else {
      element.dataset.phoneRevealState = 'watch';
      revealObserver.observe(element);
    }
  });
  cleanups.push(() => {
    revealObserver.disconnect();
    revealElements.forEach((element) => {
      delete element.dataset.phoneRevealState;
      element.style.removeProperty('--phone-reveal-delay');
    });
  });

  const portrait = root.querySelector<HTMLElement>('[data-hero-portrait]');
  const lightSweep = root.querySelector<HTMLElement>('[data-hero-light]');
  const marquee = root.querySelector<HTMLElement>('[data-marquee-track]');
  let previousScroll = scrollY;
  let scrollDirection = -1;
  let scrollFrame = 0;
  const updateScrollMotion = () => {
    scrollFrame = 0;
    const nextScroll = scrollY;
    const delta = nextScroll - previousScroll;
    if (Math.abs(delta) > 1) scrollDirection = delta > 0 ? -1 : 1;
    root.dataset.phoneScrollDirection = scrollDirection < 0 ? 'forward' : 'back';
    previousScroll = nextScroll;
    if (portrait) {
      const progress = Math.min(1, Math.max(0, nextScroll / 650));
      portrait.style.transform = `translate3d(0, ${(-16 * progress).toFixed(2)}px, 0) scale(${(1.035 + .045 * progress).toFixed(4)})`;
      if (lightSweep) lightSweep.style.transform = `translate3d(${(-12 + 148 * progress).toFixed(2)}%, 0, 0) skewX(-13deg)`;
    }
  };
  const queueScrollMotion = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
  };
  updateScrollMotion();
  addEventListener('scroll', queueScrollMotion, { passive: true });
  cleanups.push(() => {
    removeEventListener('scroll', queueScrollMotion);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    portrait?.style.removeProperty('transform');
    lightSweep?.style.removeProperty('transform');
    delete root.dataset.phoneScrollDirection;
  });

  if (marquee) {
    let marqueeFrame = 0;
    let marqueeVisible = false;
    let marqueeOffset = 0;
    let marqueeVelocity = -22;
    let previousTime = 0;
    let halfWidth = marquee.scrollWidth / 2;
    const animateMarquee = (time: number) => {
      if (!marqueeVisible) return;
      const elapsed = Math.min(32, previousTime ? time - previousTime : 16);
      previousTime = time;
      const targetVelocity = 22 * scrollDirection;
      marqueeVelocity += (targetVelocity - marqueeVelocity) * Math.min(1, elapsed / 220);
      marqueeOffset += marqueeVelocity * elapsed / 1000;
      if (halfWidth > 0) {
        while (marqueeOffset <= -halfWidth) marqueeOffset += halfWidth;
        while (marqueeOffset > 0) marqueeOffset -= halfWidth;
      }
      marquee.style.transform = `translate3d(${marqueeOffset.toFixed(2)}px, 0, 0)`;
      marqueeFrame = requestAnimationFrame(animateMarquee);
    };
    const startMarquee = () => {
      if (marqueeFrame || !marqueeVisible || document.hidden) return;
      previousTime = 0;
      marqueeFrame = requestAnimationFrame(animateMarquee);
    };
    const stopMarquee = () => {
      if (marqueeFrame) cancelAnimationFrame(marqueeFrame);
      marqueeFrame = 0;
    };
    const marqueeObserver = new IntersectionObserver(([entry]) => {
      marqueeVisible = Boolean(entry?.isIntersecting);
      if (marqueeVisible) startMarquee();
      else stopMarquee();
    }, { rootMargin: '120px 0px' });
    const onResize = () => { halfWidth = marquee.scrollWidth / 2; };
    const onVisibility = () => { if (document.hidden) stopMarquee(); else startMarquee(); };
    marqueeObserver.observe(marquee);
    addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    cleanups.push(() => {
      marqueeObserver.disconnect();
      stopMarquee();
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      marquee.style.removeProperty('transform');
    });
  }

  return () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
    delete root.dataset.phoneMotion;
    html.classList.remove('motion-compact', 'motion-compact-ready');
  };
}

export async function animateMenu(panel: HTMLElement) {
  if (reducedMotion()) return;
  panel.style.opacity = '0';
  panel.style.visibility = 'hidden';
  try {
    const { gsap } = await loadMotionRuntime();
    if (!panel.isConnected) return;
    const links = panel.querySelectorAll('.mobile-menu-link');
    gsap.timeline({ defaults: { ease: timings.ease } })
      .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: timings.quick })
      .fromTo(links, { autoAlpha: 0, y: 34 }, {
        autoAlpha: 1,
        y: 0,
        duration: timings.normal,
        stagger: timings.staggerContent,
      }, '-=.1');
  } catch {
    panel.style.opacity = '1';
    panel.style.visibility = 'visible';
  }
}

export function MotionChrome() {
  return <>
    <div className="page-loader" data-motion-loader="idle" aria-hidden="true">
      <span className="page-loader-mark"><img src="/brand/logo-steel.svg" width="441" height="224" alt="" /></span>
      <span className="page-loader-line" />
    </div>
    <div className="motion-cursor" aria-hidden="true"><span /></div>
  </>;
}

export function MotionPage({ path, children }: { path: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    if (matchMedia('(max-width: 47.99rem)').matches) {
      return mountCompactMotion(root);
    }
    document.documentElement.classList.add('motion-ready');
    const cleanups: Array<() => void> = [];
    let cancelled = false;

    void loadMotionRuntime().then(({ gsap, ScrollTrigger, SplitText, Lenis }) => {
      if (cancelled) return;

      const loader = document.querySelector<HTMLElement>('[data-motion-loader]');
      let showIntro = path === '/';
      try {
        showIntro = showIntro && sessionStorage.getItem('robweb-motion-intro') !== 'seen';
        if (showIntro) sessionStorage.setItem('robweb-motion-intro', 'seen');
      } catch { /* Session storage is an optional enhancement. */ }
      if (loader) {
        if (showIntro) {
          loader.dataset.motionLoader = 'active';
          gsap.timeline({ defaults: { ease: timings.easeInOut } })
            .fromTo(loader.querySelector('.page-loader-mark'), { autoAlpha: 0, scale: .72, rotate: -8 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: .48 })
            .fromTo(loader.querySelector('.page-loader-line'), { scaleX: 0 }, { scaleX: 1, duration: .34 }, '-=.18')
            .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .5, onComplete: () => { loader.dataset.motionLoader = 'done'; } }, '-=.04');
        } else {
          loader.dataset.motionLoader = 'done';
        }
      }

      const lenis = new Lenis({
        duration: 1.08,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: .9,
      });
      document.documentElement.classList.add('lenis-active');
      let rafId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        document.documentElement.classList.remove('lenis-active');
      });

      const splits: Array<InstanceType<typeof SplitText>> = [];
      root.querySelectorAll<HTMLElement>('[data-split]').forEach((element) => {
        const split = SplitText.create(element, {
          type: 'words,chars',
          wordsClass: 'split-word',
          charsClass: 'split-char',
          aria: 'auto',
        });
        splits.push(split);
        const hero = element.dataset.split === 'hero';
        gsap.fromTo(split.chars, { yPercent: 118, rotate: 2 }, {
          yPercent: 0,
          rotate: 0,
          duration: hero ? .92 : timings.normal,
          delay: hero ? (showIntro ? .68 : .08) : 0,
          stagger: timings.staggerCharacters,
          ease: timings.ease,
          immediateRender: hero,
          scrollTrigger: hero ? undefined : { trigger: element, start: 'top 88%', once: true },
        });
      });
      cleanups.push(() => splits.forEach((split) => split.revert()));

      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        element.dataset.revealState = 'watch';
        gsap.fromTo(element, { autoAlpha: 0, y: 38 }, {
          autoAlpha: 1,
          y: 0,
          duration: timings.normal,
          ease: timings.ease,
          immediateRender: false,
          scrollTrigger: { trigger: element, start: 'top 91%', once: true },
          onComplete: () => { element.dataset.revealState = 'done'; },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.fromTo(group.children, { autoAlpha: 0, y: 30 }, {
          autoAlpha: 1,
          y: 0,
          duration: timings.normal,
          stagger: timings.staggerContent,
          ease: timings.ease,
          immediateRender: false,
          scrollTrigger: { trigger: group, start: 'top 90%', once: true },
        });
      });

      const heroPortrait = root.querySelector<HTMLElement>('[data-hero-portrait]');
      const heroLight = root.querySelector<HTMLElement>('[data-hero-light]');
      const heroLogoScene = root.querySelector<HTMLElement>('.webgl-slot');
      if (heroPortrait) {
        const heroTimeline = gsap.timeline({
          scrollTrigger: { trigger: '.home-hero', start: 'top top', end: 'bottom top', scrub: .65 },
        });
        heroTimeline.fromTo(heroPortrait, { scale: 1.015, yPercent: 0 }, {
          scale: 1.085,
          yPercent: 7,
          ease: 'none',
        }, 0);
        if (heroLight) {
          heroTimeline.fromTo(heroLight, { xPercent: -115, autoAlpha: .08 }, {
            xPercent: 125,
            autoAlpha: .72,
            ease: 'none',
          }, 0);
        }
        if (heroLogoScene) {
          heroTimeline.fromTo(heroLogoScene, { yPercent: 0 }, { yPercent: -11, ease: 'none' }, 0);
        }
      }

      const marquee = root.querySelector<HTMLElement>('[data-marquee-track]');
      const marqueeTween = marquee ? gsap.to(marquee, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 }) : null;
      let marqueeDirection = 1;
      let navHidden = false;
      const header = document.querySelector<HTMLElement>('.site-header');
      const onScroll = ({ direction, velocity }: { direction: number; velocity: number }) => {
        if (marqueeTween && direction && direction !== marqueeDirection) {
          marqueeDirection = direction;
          gsap.to(marqueeTween, { timeScale: direction > 0 ? 1 : -1, duration: timings.normal, ease: timings.ease });
        }
        const shouldHide = direction > 0 && Math.abs(velocity) > .25 && window.scrollY > 140;
        const shouldShow = direction < 0 || window.scrollY <= 20;
        if (header && ((shouldHide && !navHidden) || (shouldShow && navHidden))) {
          navHidden = shouldHide;
          gsap.to(header, { yPercent: navHidden ? -110 : 0, duration: timings.quick, ease: 'power3.out', overwrite: true });
        }
      };
      lenis.on('scroll', onScroll);
      cleanups.push(() => lenis.off('scroll', onScroll));

      const spark = root.querySelector('.marquee-spark');
      if (spark) {
        gsap.to(spark, { rotate: 240, ease: 'none', scrollTrigger: { trigger: spark, start: 'top bottom', end: 'bottom top', scrub: .5 } });
      }

      const footerGradient = document.querySelector<HTMLElement>('.footer-gradient');
      if (footerGradient) {
        const footerTween = gsap.to(footerGradient, { xPercent: 34, rotate: 10, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true });
        ScrollTrigger.create({
          trigger: footerGradient,
          start: 'top bottom',
          end: 'bottom top',
          onEnter: () => footerTween.play(),
          onEnterBack: () => footerTween.play(),
          onLeave: () => footerTween.pause(),
          onLeaveBack: () => footerTween.pause(),
        });
      }

      const linkSplits: Array<InstanceType<typeof SplitText>> = [];
      document.querySelectorAll<HTMLElement>('[data-link-label]').forEach((label) => {
        const split = SplitText.create(label, { type: 'chars', charsClass: 'link-char', aria: 'auto' });
        linkSplits.push(split);
        const link = label.closest('a');
        if (!link) return;
        const enter = () => {
          gsap.timeline().to(split.chars, { yPercent: -115, autoAlpha: 0, duration: .16, stagger: .012, ease: 'power2.in' })
            .set(split.chars, { yPercent: 115 })
            .to(split.chars, { yPercent: 0, autoAlpha: 1, duration: .32, stagger: .012, ease: timings.ease });
        };
        link.addEventListener('pointerenter', enter);
        cleanups.push(() => link.removeEventListener('pointerenter', enter));
      });
      cleanups.push(() => linkSplits.forEach((split) => split.revert()));

      if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const cursor = document.querySelector<HTMLElement>('.motion-cursor');
        if (cursor) {
          const xTo = gsap.quickTo(cursor, 'x', { duration: .28, ease: 'power3.out' });
          const yTo = gsap.quickTo(cursor, 'y', { duration: .28, ease: 'power3.out' });
          const move = (event: PointerEvent) => { cursor.dataset.visible = 'true'; xTo(event.clientX); yTo(event.clientY); };
          const leave = () => { cursor.dataset.visible = 'false'; };
          window.addEventListener('pointermove', move, { passive: true });
          document.documentElement.addEventListener('mouseleave', leave);
          cleanups.push(() => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('mouseleave', leave); });
        }
      }

      root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((button) => {
        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          const box = button.getBoundingClientRect();
          gsap.to(button, {
            x: (event.clientX - box.left - box.width / 2) * .13,
            y: (event.clientY - box.top - box.height / 2) * .16,
            duration: timings.quick,
            ease: timings.ease,
          });
        };
        const leave = () => gsap.to(button, { x: 0, y: 0, duration: timings.normal, ease: timings.ease });
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
        gsap.to(root, { autoAlpha: 0, y: -10, duration: timings.quick, ease: 'power2.in', onComplete: () => { location.href = url.href; } });
      };
      document.addEventListener('click', transition);
      cleanups.push(() => document.removeEventListener('click', transition));

      ScrollTrigger.refresh();
      cleanups.push(() => ScrollTrigger.getAll().forEach((trigger) => trigger.kill()));
    });

    return () => {
      cancelled = true;
      cleanups.reverse().forEach((cleanup) => cleanup());
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
      if (reducedMotion()) return 'reduced-motion';
      if (hints.connection?.saveData) return 'save-data';
      if (hints.deviceMemory && hints.deviceMemory <= 2) return 'low-memory';
      if (hints.hardwareConcurrency && hints.hardwareConcurrency <= 2) return 'low-cpu';
      try {
        const battery = await hints.getBattery?.();
        if (battery && !battery.charging && battery.level <= .2) return 'low-battery';
      } catch { /* Battery status is optional. */ }
      // 18 Nov 2026 (Ian): phones get the live 3D logo too, small, at the portrait's bottom-right; the other gates still apply.
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
  return <div ref={ref} className="webgl-slot" data-state="static" aria-hidden="true"><div className="rc-stack">{Array.from({ length: 14 }, (_, i) => <img key={i} src="/brand/logo.svg" width="441" height="224" alt="" className={i === 0 ? 'rc-stack-front' : 'rc-stack-back'} style={{ transform: `translateZ(${(6.5 - i) * 1.5}px)` }} />)}</div><span>RC · dimensional mark</span></div>;
}
