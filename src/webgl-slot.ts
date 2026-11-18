import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export function mountWebglSlot(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.style.opacity = '0';
  renderer.domElement.dataset.rcLogoCanvas = 'true';
  container.dataset.dpr = String(pixelRatio);
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 40);
  camera.position.set(0, .05, 8.5);

  const logoRoot = new THREE.Group();
  logoRoot.rotation.set(-.08, -.38, -.045);
  scene.add(logoRoot);

  scene.add(new THREE.HemisphereLight(0xf5f7fa, 0x11151b, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 5.5);
  key.position.set(-3.4, 4.2, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xf5a623, 28, 16, 1.8);
  rim.position.set(4, .4, 3.8);
  scene.add(rim);
  const steel = new THREE.PointLight(0x7c8da6, 18, 14, 2);
  steel.position.set(-4, -2.5, 2.2);
  scene.add(steel);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd8dce1,
    metalness: .88,
    roughness: .24,
    clearcoat: .72,
    clearcoatRoughness: .2,
    side: THREE.DoubleSide,
  });

  let disposed = false;
  let loaded = false;
  let visible = true;
  let raf = 0;
  let scrollProgress = 0;
  let logoBaseY = 0;
  const pointer = new THREE.Vector2();
  const targetPointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  const size = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const draw = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    pointer.lerp(targetPointer, .035);
    const elapsed = clock.getElapsedTime();
    logoRoot.rotation.y = elapsed * .18; // 18 Nov 2026 (Ian): a much slower turn in one place (~35 s a revolution)
    logoRoot.rotation.x = -.08;
    logoRoot.rotation.z = 0;
    logoRoot.position.y = logoBaseY;
    rim.position.x = 4 - scrollProgress * 7.5;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(draw);
  };
  const start = () => { if (!raf && loaded && visible && !document.hidden) raf = requestAnimationFrame(draw); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

  const onPointer = (event: PointerEvent) => {
    targetPointer.set((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * -2);
  };
  const onScroll = () => {
    scrollProgress = Math.min(1, Math.max(0, scrollY / Math.max(1, innerHeight * .9)));
  };
  const onVisibility = () => { if (document.hidden) stop(); else start(); };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    container.dataset.paused = visible ? 'false' : 'true';
    if (visible) start(); else stop();
  }, { rootMargin: '120px' });
  const resize = new ResizeObserver(() => { size(); if (loaded && visible) renderer.render(scene, camera); });
  intersection.observe(container);
  resize.observe(container);
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  size();
  onScroll();

  new SVGLoader().load('/brand/logo.svg', (data) => {
    if (disposed) return;
    data.paths.forEach((path) => {
      SVGLoader.createShapes(path).forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 34,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 2.2,
          bevelThickness: 3,
          curveSegments: 10,
        });
        geometry.computeVertexNormals();
        logoRoot.add(new THREE.Mesh(geometry, material));
      });
    });
    logoRoot.rotation.set(0, 0, 0); // measure the centre with no tilt, so the spin axis really passes through the middle
    logoRoot.updateMatrixWorld(true);
    const unscaled = new THREE.Box3().setFromObject(logoRoot);
    const dimensions = unscaled.getSize(new THREE.Vector3());
    // 18 Nov 2026 (Ian: "it's going round, make it spin in one place"): centre the geometry on the group's own origin, so
    // rotating the group turns the logo about its middle instead of orbiting the SVG's top-left corner.
    const localCentre = unscaled.getCenter(new THREE.Vector3());
    logoRoot.children.forEach((child) => (child as THREE.Mesh).geometry.translate(-localCentre.x, -localCentre.y, -localCentre.z));
    const scale = 3.3 / Math.max(dimensions.x, dimensions.y); // 18 Nov 2026: leave room so the turning logo is never clipped by the canvas
    logoRoot.scale.set(scale, -scale, scale);
    logoRoot.position.set(0, 0, 0);
    logoBaseY = 0;
    loaded = true;
    container.dataset.state = 'ready';
    renderer.domElement.style.opacity = '1';
    [...container.children].forEach((child) => { if (child !== renderer.domElement) child.remove(); });
    clock.start();
    start();
  }, undefined, () => {
    if (disposed) return;
    renderer.domElement.remove();
    container.dataset.state = 'fallback';
    container.dataset.webglReason = 'svg-load-error';
  });

  return () => {
    disposed = true;
    stop();
    intersection.disconnect();
    resize.disconnect();
    removeEventListener('pointermove', onPointer);
    removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    logoRoot.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
