const VERTEX = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
  precision highp float;
  uniform vec2 resolution;
  uniform vec2 pointer;
  uniform float time;

  float line(float value, float width) {
    return smoothstep(width, 0.0, abs(value));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.18;
    float drift = pointer.x * 0.11 + pointer.y * 0.05;

    float ribbonA = p.y - sin(p.x * 1.25 + t) * 0.23 - 0.05 - drift;
    float ribbonB = p.y - sin(p.x * 1.55 - t * 0.72 + 1.8) * 0.18 + 0.42 + drift * 0.5;
    float ribbonC = p.y - sin(p.x * 0.9 + t * 0.55 + 4.2) * 0.15 - 0.55;

    float a = line(ribbonA, 0.18) * (0.65 + line(ribbonA, 0.025));
    float b = line(ribbonB, 0.12) * (0.48 + line(ribbonB, 0.018));
    float c = line(ribbonC, 0.09) * 0.28;
    float gridX = line(fract(uv.x * 20.0) - 0.5, 0.018);
    float gridY = line(fract(uv.y * 12.0) - 0.5, 0.018);

    vec3 amber = vec3(0.961, 0.651, 0.137);
    vec3 steel = vec3(0.49, 0.56, 0.66);
    vec3 colour = amber * a * 0.32 + amber * b * 0.2 + steel * c * 0.18;
    colour += steel * (gridX + gridY) * 0.016;
    float vignette = smoothstep(1.45, 0.18, length(p * vec2(0.72, 0.92)));
    colour *= 0.42 + vignette * 0.68;
    gl_FragColor = vec4(colour, clamp(a + b + c + (gridX + gridY) * 0.04, 0.0, 0.72));
  }
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const compiled = gl.createShader(type);
  if (!compiled) throw new Error('Unable to create WebGL shader');
  gl.shaderSource(compiled, source);
  gl.compileShader(compiled);
  if (!gl.getShaderParameter(compiled, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(compiled) || 'WebGL shader failed');
  return compiled;
}

export function mountWebglSlot(container: HTMLElement) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL unavailable');
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create WebGL program');
  const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL link failed');
  gl.useProgram(program);

  const points = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, points);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'resolution');
  const time = gl.getUniformLocation(program, 'time');
  const pointer = gl.getUniformLocation(program, 'pointer');

  container.replaceChildren(canvas);
  container.dataset.state = 'ready';
  let raf = 0;
  let visible = true;
  const pointerValue = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const started = performance.now();

  const size = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.floor(container.clientWidth * ratio));
    const height = Math.max(1, Math.floor(container.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };
  const move = (event: PointerEvent) => {
    targetPointer.x = (event.clientX / innerWidth - .5) * 2;
    targetPointer.y = (event.clientY / innerHeight - .5) * 2;
  };
  const draw = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    size();
    pointerValue.x += (targetPointer.x - pointerValue.x) * .035;
    pointerValue.y += (targetPointer.y - pointerValue.y) * .035;
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(pointer, pointerValue.x, pointerValue.y);
    gl.uniform1f(time, (now - started) / 1000);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(draw);
  };
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const visibility = () => { if (document.hidden) stop(); else start(); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); }, { rootMargin: '100px' });
  observer.observe(container);
  addEventListener('pointermove', move, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  start();

  return () => {
    stop();
    observer.disconnect();
    removeEventListener('pointermove', move);
    document.removeEventListener('visibilitychange', visibility);
    gl.deleteBuffer(points);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
