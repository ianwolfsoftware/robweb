import * as THREE from '../../node_modules/three/build/three.module.js';
import { createFrameMeter, createVisibilityLoop, sizeRenderer } from '../shared/perf.js';

export async function mount(root) {
  const host = root.querySelector('.spike-canvas');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x0b0d10, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0d10, .055);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, .4, 9);

  const rig = new THREE.Group();
  rig.position.set(innerWidth < 650 ? 1.2 : 2.4, .15, 0);
  scene.add(rig);
  const amber = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: .58, metalness: .08 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x69717d, roughness: .42, metalness: .62 });
  const parts = [];

  function addPart(size, target, rotation, material, explode) {
    const geometry = new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { target: new THREE.Vector3(...target), explode: new THREE.Vector3(...explode), targetRotation: rotation };
    mesh.position.copy(mesh.userData.explode);
    mesh.rotation.z = rotation;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xdde2e9, transparent: true, opacity: .38 }));
    mesh.add(edges);
    rig.add(mesh);
    parts.push(mesh);
  }

  addPart([4.8, .22, .38], [0, -1.05, 0], 0, steel, [0, -2.8, 1.8]);
  addPart([3.45, .28, .48], [-1.25, .15, 0], .68, amber, [-3.8, 2.6, 1.2]);
  addPart([3.45, .28, .48], [1.25, .15, 0], -.68, amber, [3.8, 2.6, 1.2]);
  addPart([2.08, .17, .28], [-1.02, -.35, .06], -.48, steel, [-3.4, -.7, 2.2]);
  addPart([2.08, .17, .28], [1.02, -.35, .06], .48, steel, [3.4, -.7, 2.2]);
  addPart([2.15, .14, .22], [0, -.18, -.08], Math.PI / 2, steel, [0, 3.5, 2.7]);
  addPart([.34, .38, .75], [0, 1.45, 0], 0, amber, [0, 3.8, -1.8]);

  scene.add(new THREE.HemisphereLight(0xd7e4f1, 0x14171c, 2.3));
  const light = new THREE.DirectionalLight(0xffd494, 4.5);
  light.position.set(-3, 5, 5);
  scene.add(light);
  const rim = new THREE.PointLight(0xf5a623, 32, 12);
  rim.position.set(4, -1, 3);
  scene.add(rim);

  const pointer = new THREE.Vector2();
  addEventListener('pointermove', (event) => pointer.set((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * 2), { passive: true });
  const resize = () => {
    sizeRenderer(renderer, camera, root, { perspective: true });
    rig.position.x = innerWidth < 650 ? .65 : 2.25;
    rig.scale.setScalar(innerWidth < 650 ? .68 : 1);
  };
  new ResizeObserver(resize).observe(root);
  resize();

  const meter = createFrameMeter('exploded-joint');
  const started = performance.now();
  function frame(now) {
    const elapsed = Math.min(1, (now - started) / 1600);
    const settle = 1 - Math.pow(1 - elapsed, 4);
    parts.forEach((part, index) => {
      const local = Math.max(0, Math.min(1, settle * 1.4 - index * .055));
      part.position.lerpVectors(part.userData.explode, part.userData.target, local);
      part.rotation.y = (1 - local) * (index % 2 ? .7 : -.7);
      part.rotation.z = part.userData.targetRotation;
    });
    rig.rotation.y += ((pointer.x * .18) - rig.rotation.y) * .025;
    rig.rotation.x += ((pointer.y * .09) - rig.rotation.x) * .025;
    renderer.render(scene, camera);
    meter(now, renderer);
  }
  createVisibilityLoop(root, frame);
}
