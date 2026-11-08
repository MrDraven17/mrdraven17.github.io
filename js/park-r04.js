// r04 — "In the current" (3-012) rebuilt from the single photograph.
// The scene is rebuilt around the photo's own camera, so the default view reproduces the picture exactly:
//  - background: one mesh, each vertex pushed out along its view ray to the baked depth (ground plane,
//    hedge band, far trees/building), textured with the clean plate (person + bench removed);
//  - person and bench: cut-outs standing at their measured distances, so they slide over the plate;
//  - a few leaves drifting down through the space.
// Movement is limited (like metalforge.xyz/meadow): a small orbit around the walker and lens zoom only.
import * as THREE from 'three';

const app = document.getElementById('space-app'), stage = document.getElementById('space-stage');
const BASE = 'assets/park-r04/';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fail = m => window.spaceFailure ? window.spaceFailure(m) : console.error(m);

const load = url => new Promise((ok, no) => new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; ok(t); }, undefined, () => no(Error(url))));

(async () => {
  let S, plate, depth, person, bench, lamp;
  try {
    // assets/park-r04/data.js (loaded first by space-loader.js) embeds everything, so file:// works too.
    const packed = window.PARK_R04;
    S = packed ? packed.scene : await (await fetch(BASE + 'scene.json')).json();
    [plate, depth, person, bench, lamp] = await Promise.all(['plate.webp', 'depth.png', 'person.webp', 'bench.webp', 'lamp.webp'].map(f => load(packed ? packed.images[f] : BASE + f)));
  } catch (e) { fail('场景资源加载失败，请重新加载。'); return; }
  depth.minFilter = depth.magFilter = THREE.LinearFilter; depth.generateMipmaps = false;

  const [W, H] = S.photo, F = S.focal, CX = W / 2, CY = S.horizon, [ox, oy, PW, PH] = S.pad;
  // Photo-camera space: level camera at height camHeight, principal point (CX, horizon).
  const toWorld = (px, py, z) => new THREE.Vector3((px - CX) / F * z, S.camHeight - (py - CY) / F * z, -z);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // textures are passed through untouched
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  stage.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '移动鼠标或拖动，在原图视角附近环顾');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x181b17);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 400);

  // Background mesh in plate pixel space; positions are computed in the vertex shader from depth.
  const GX = 300, GY = 200, geo = new THREE.PlaneGeometry(1, 1, GX, GY);
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { plate: { value: plate }, depth: { value: depth }, pad: { value: new THREE.Vector4(ox, oy, PW, PH) },
      cam: { value: new THREE.Vector4(CX, CY, F, S.camHeight) }, invz: { value: new THREE.Vector2(1 / S.zmin, 1 / S.zmax) }, nearClamp: { value: 6.0 } },
    vertexShader: `uniform sampler2D depth;uniform vec4 pad,cam;uniform vec2 invz;uniform float nearClamp;varying vec2 vUv;
      void main(){vUv=uv;float d=texture2D(depth,vec2(uv.x,uv.y)).r;float z=1.0/(d*(invz.x-invz.y)+invz.y);
        if(z<nearClamp)z=nearClamp+(z-nearClamp)*0.35;
        vec2 px=vec2(uv.x*pad.z-pad.x,(1.0-uv.y)*pad.w-pad.y);
        vec3 p=vec3((px.x-cam.x)/cam.z*z,cam.w-(px.y-cam.y)/cam.z*z,-z);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader: `uniform sampler2D plate;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(plate,vUv).rgb,1.0);}`,
  });
  // Very near ground (bottom of the photo, ~3.5 m) is pulled back a little so its parallax stays inside the
  // padded plate; the default view is unaffected because every point stays on its own view ray.
  const bg = new THREE.Mesh(geo, bgMat); bg.frustumCulled = false; scene.add(bg);

  const cutMat = tex => new THREE.ShaderMaterial({ uniforms: { map: { value: tex } }, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform sampler2D map;varying vec2 vUv;void main(){vec4 c=texture2D(map,vUv);if(c.a<.01)discard;gl_FragColor=c;}' });
  const textures = { person, bench, lamp };
  for (const L of S.layers) {
    const [x0, y0, x1, y1] = L.box, a = toWorld(x0, y0, L.z - .05), b = toWorld(x1, y1, L.z - .05);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b.x - a.x, a.y - b.y), cutMat(textures[L.name]));
    m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, -(L.z - .05)); m.renderOrder = { lamp: 1, bench: 2, person: 3 }[L.name]; scene.add(m);
  }

  // Falling leaves: small double-sided quads drawn in the photo's own leaf colours.
  const leafTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.translate(32, 32); g.rotate(.5); g.beginPath(); g.moveTo(0, -28); g.bezierCurveTo(20, -18, 18, 14, 0, 28); g.bezierCurveTo(-18, 14, -20, -18, 0, -28); g.fillStyle = '#fff'; g.fill();
    g.strokeStyle = '#0003'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 26); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
  const LEAVES = reduce.matches ? 0 : 46, palette = [0xb5652d, 0xc98a4a, 0x8f5a2c, 0xd49a5c, 0xa8743f];
  const leafMat = new THREE.MeshBasicMaterial({ map: leafTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: .2 });
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(.16, .16), leafMat, Math.max(1, LEAVES));
  leaves.count = LEAVES; leaves.renderOrder = 4; scene.add(leaves);
  const rand = (a, b) => a + Math.random() * (b - a);
  const L = Array.from({ length: LEAVES }, () => ({ x: rand(-9, 9), y: rand(0, 9), z: rand(5, 22), vy: rand(.25, .55), ph: rand(0, 6.3), sp: rand(.6, 1.4), rx: rand(0, 6), ry: rand(0, 6) }));
  L.forEach((l, i) => leaves.setColorAt(i, new THREE.Color(palette[i % palette.length])));
  const dummy = new THREE.Object3D();

  // ---- View: orbit around the walker within a small window; zoom changes lens only. ----
  const PIVOT = toWorld(735, 600, 11.3), YAW = THREE.MathUtils.degToRad(3.2), PITCH = THREE.MathUtils.degToRad(1.1);
  const RADIUS = PIVOT.length();
  const views = { left: [-.85, .1], photo: [0, 0], right: [.85, .1] };
  let tx = 0, ty = 0, cx = 0, cy = 0, zoom = 1, tz = 1, drag = null, last = performance.now(), idle = 0, interacted = false;
  function frameCamera() {
    const yaw = cx * YAW, pitch = cy * PITCH;
    // Rotate the original camera position (origin) about the pivot.
    const off = new THREE.Vector3(0, S.camHeight, 0).sub(PIVOT);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    off.applyAxisAngle(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw), pitch);
    camera.position.copy(PIVOT).add(off);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    // Asymmetric frustum = the photo's lens (principal point on the horizon), cropped to cover the window.
    const w = stage.clientWidth, h = stage.clientHeight, A = w / h, inset = 1.11 * zoom;
    let hw = W / 2 / inset, hh = hw / A; if (hh > H / 2 / inset) { hh = H / 2 / inset; hw = hh * A; }
    const n = camera.near, mid = H / 2;
    camera.projectionMatrix.makePerspective((-hw) / F * n, hw / F * n, (CY - (mid - hh)) / F * n, (CY - (mid + hh)) / F * n, n, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  function resize() { renderer.setSize(stage.clientWidth, stage.clientHeight, false); }
  addEventListener('resize', resize); resize();

  const canvas = renderer.domElement, clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
  const touched = () => { if (!interacted) { interacted = true; document.body.classList.add('space-interacted'); } idle = 0; };
  canvas.addEventListener('pointermove', e => {
    if (drag) { tx = clamp(drag.x - (e.clientX - drag.px) / 260); ty = clamp(drag.y - (e.clientY - drag.py) / 260); touched(); return; }
    if (e.pointerType === 'mouse') { const r = canvas.getBoundingClientRect(); tx = clamp(((e.clientX - r.left) / r.width * 2 - 1) * 1.15); ty = clamp(((e.clientY - r.top) / r.height * 2 - 1) * 1.15); touched(); }
  });
  canvas.addEventListener('pointerdown', e => { drag = { px: e.clientX, py: e.clientY, x: tx, y: ty }; canvas.setPointerCapture(e.pointerId); });
  const end = () => { drag = null; }; canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', e => { e.preventDefault(); tz = clamp(tz * Math.exp(-e.deltaY * .0012), 1, 1.6); touched(); }, { passive: false });
  let pinch = null; canvas.addEventListener('touchmove', e => { if (e.touches.length !== 2) { pinch = null; return; } const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) tz = clamp(tz * d / pinch, 1, 1.6); pinch = d; }, { passive: true });
  canvas.addEventListener('keydown', e => { const k = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.25], ArrowDown: [0, .25] }[e.key];
    if (k) { tx = clamp(tx + k[0]); ty = clamp(ty + k[1]); touched(); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') tz = clamp(tz * 1.12, 1, 1.6); if (e.key === '-') tz = clamp(tz / 1.12, 1, 1.6); if (e.key === 'Home') setView('photo'); });
  const viewButtons = [...document.querySelectorAll('[data-space-view]')];
  function setView(v) { [tx, ty] = views[v]; tz = 1; viewButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.spaceView === v))); }
  viewButtons.forEach(b => b.addEventListener('click', () => { setView(b.dataset.spaceView); touched(); }));
  document.getElementById('space-reset')?.addEventListener('click', () => setView('photo'));
  document.getElementById('space-zoom-in')?.addEventListener('click', () => { tz = clamp(tz * 1.15, 1, 1.6); });
  document.getElementById('space-zoom-out')?.addEventListener('click', () => { tz = clamp(tz / 1.15, 1, 1.6); });
  const compare = document.getElementById('space-compare'), ref = document.getElementById('space-reference');
  compare?.addEventListener('click', () => { const on = compare.getAttribute('aria-pressed') !== 'true'; compare.setAttribute('aria-pressed', String(on)); ref.hidden = !on; document.body.classList.toggle('space-comparing', on); });
  canvas.addEventListener('pointerleave', () => { if (!drag) { tx *= .5; ty *= .5; } });

  let visible = true; document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(loop); } });
  function loop(now) {
    if (!visible) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; idle += dt;
    // After a few idle seconds the view breathes very slightly, as if someone were standing there.
    const sway = reduce.matches || idle < 4 ? 0 : Math.min(1, (idle - 4) / 3);
    const gx = tx + sway * .22 * Math.sin(now / 5200), gy = ty + sway * .12 * Math.sin(now / 7300 + 1);
    const k = 1 - Math.pow(.0025, dt);
    cx += (gx - cx) * k; cy += (gy - cy) * k; zoom += (tz - zoom) * k;
    frameCamera();
    for (let i = 0; i < LEAVES; i++) { const l = L[i]; const t = now / 1000 * l.sp + l.ph;
      l.y -= l.vy * dt; l.x += Math.sin(t * .7) * .35 * dt + .12 * dt; if (l.y < -.1) { l.y = rand(6, 10); l.x = rand(-10, 8); l.z = rand(5, 22); }
      dummy.position.set(l.x * l.z / 12, l.y, -l.z); dummy.rotation.set(l.rx + t * 1.3, l.ry + t * .9, Math.sin(t) * .8); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix); }
    if (LEAVES) leaves.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; loop(t); document.body.classList.add('space-ready'); document.getElementById('space-loading').hidden = true; });
  app.dataset.ready = '1';
})();
