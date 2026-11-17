export function mountWebglSlot(container: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = 360;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL unavailable');
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.043, 0.051, 0.063, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  container.replaceChildren(canvas);
  container.dataset.state = 'ready';
  return () => gl.getExtension('WEBGL_lose_context')?.loseContext();
}
