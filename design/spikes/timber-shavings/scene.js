import * as THREE from '../../node_modules/three/build/three.module.js';
import { createFrameMeter, createVisibilityLoop, sizeRenderer } from '../shared/perf.js';

const VERTEX = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  void main(){
    vec2 p=vUv*vec2(3.0,15.0);
    float warp=noise(vec2(p.y*.22,p.x*1.7))*2.2;
    float grain=sin((p.y+warp)*10.0+sin(p.x*7.0))*0.5+0.5;
    float fine=noise(p*vec2(5.0,1.8)+uTime*.015);
    vec3 dark=vec3(.055,.047,.038);
    vec3 warm=vec3(.24,.135,.055);
    vec3 colour=mix(dark,warm,pow(grain,.8)*.45+fine*.11);
    float vignette=smoothstep(.95,.28,distance(vUv,vec2(.58,.48)));
    gl_FragColor=vec4(colour*(.45+.65*vignette),1.0);
  }
`;

export async function mount(root) {
  const host = root.querySelector('.spike-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, .1, 50);
  camera.position.z = 7;

  const uniforms = { uTime: { value: 0 } };
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms }));
  backdrop.position.z = -2;
  scene.add(backdrop);

  const count = innerWidth < 600 ? 130 : 220;
  const positions = new Float32Array(count * 3);
  const origins = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const index = i * 3;
    positions[index] = origins[index] = (Math.random() - .5) * 9;
    positions[index + 1] = origins[index + 1] = (Math.random() - .5) * 5.5;
    positions[index + 2] = origins[index + 2] = Math.random() * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf5a623, size: .045, transparent: true, opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(particles);

  const pointer = new THREE.Vector2();
  addEventListener('pointermove', (event) => pointer.set((event.clientX / innerWidth - .5) * 6, -(event.clientY / innerHeight - .5) * 3.6), { passive: true });
  const resize = () => sizeRenderer(renderer, camera, root, { perspective: true });
  new ResizeObserver(resize).observe(root);
  resize();

  const meter = createFrameMeter('timber-shavings');
  function frame(now) {
    const time = now * .001;
    uniforms.uTime.value = time;
    for (let i = 0; i < count; i++) {
      const index = i * 3;
      const wave = time * (.18 + (i % 7) * .012) + i;
      positions[index] = origins[index] + Math.sin(wave) * .12 + pointer.x * .035;
      positions[index + 1] = origins[index + 1] + Math.cos(wave * .73) * .16 + pointer.y * .035;
    }
    geometry.attributes.position.needsUpdate = true;
    particles.rotation.z = Math.sin(time * .15) * .025;
    renderer.render(scene, camera);
    meter(now, renderer);
  }
  createVisibilityLoop(root, frame);
}
