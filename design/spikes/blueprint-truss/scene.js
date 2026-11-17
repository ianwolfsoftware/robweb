import * as THREE from '../../node_modules/three/build/three.module.js';
import { createFrameMeter, createVisibilityLoop, sizeRenderer } from '../shared/perf.js';

const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uAspect;

  float gridLine(float coordinate, float scale, float width) {
    float cell = abs(fract(coordinate * scale - .5) - .5) / fwidth(coordinate * scale);
    return 1.0 - min(cell / width, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    vec2 shifted = uv + uPointer * .012;
    float fine = max(gridLine(shifted.x * uAspect.x, 22.0, .8), gridLine(shifted.y * uAspect.y, 22.0, .8));
    float major = max(gridLine(shifted.x * uAspect.x, 5.5, 1.1), gridLine(shifted.y * uAspect.y, 5.5, 1.1));
    float scan = .025 * sin((uv.y + uTime * .01) * 110.0);
    vec3 base = vec3(.043, .071, .105) + scan;
    vec3 minorColour = vec3(.22, .42, .56) * fine * .24;
    vec3 majorColour = vec3(.36, .63, .74) * major * .28;
    float glow = .08 / max(.08, distance(uv, vec2(.68, .43)));
    gl_FragColor = vec4(base + minorColour + majorColour + vec3(.96, .52, .08) * glow * .035, 1.0);
  }
`;

export async function mount(root) {
  const host = root.querySelector('.spike-canvas');
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
  camera.position.z = 2;

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uAspect: { value: new THREE.Vector2(1, 1) }
  };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms })));

  const points = [
    [-.78, -.45], [.78, -.45],
    [-.78, -.45], [0, .42],
    [0, .42], [.78, -.45],
    [-.55, -.45], [-.28, .10],
    [-.28, .10], [0, -.45],
    [0, -.45], [.28, .10],
    [.28, .10], [.55, -.45],
    [0, .42], [0, -.45]
  ];
  const targets = Float32Array.from(points.flatMap(([x, y]) => [x, y, 0]));
  const positions = new Float32Array(targets.length);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const truss = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xf5a623, transparent: true, opacity: .98 }));
  truss.position.set(.15, .03, .2);
  truss.scale.setScalar(.78);
  scene.add(truss);

  const pointer = new THREE.Vector2();
  addEventListener('pointermove', (event) => {
    pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  }, { passive: true });

  const resize = () => {
    const { width, height } = sizeRenderer(renderer, camera, root);
    uniforms.uAspect.value.set(width / Math.min(width, height), height / Math.min(width, height));
  };
  new ResizeObserver(resize).observe(root);
  resize();

  const meter = createFrameMeter('blueprint-truss');
  const started = performance.now();
  function frame(now) {
    const intro = Math.min(1, (now - started) / 1150);
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const scrollProgress = Math.min(1, scrollY / scrollRange);
    const progress = 1 - Math.pow(1 - Math.max(intro, scrollProgress), 3);
    for (let index = 0; index < targets.length; index += 3) {
      const segment = Math.floor(index / 6);
      const local = Math.max(0, Math.min(1, progress * 1.7 - segment * .08));
      positions[index] = targets[index] * local;
      positions[index + 1] = targets[index + 1] * local;
    }
    geometry.attributes.position.needsUpdate = true;
    uniforms.uTime.value = now * .001;
    uniforms.uPointer.value.lerp(pointer, .045);
    truss.rotation.x += ((pointer.y * .08) - truss.rotation.x) * .035;
    truss.rotation.y += ((pointer.x * .08) - truss.rotation.y) * .035;
    renderer.render(scene, camera);
    meter(now, renderer);
  }
  createVisibilityLoop(root, frame);
}
