/* ===========================================================================
   LOGO PARTICLE SPHERE
   A small Three.js particle sphere orbiting behind the nav logo icon on
   hover — the icon artwork itself is untouched, this only adds a halo
   around it. Ported to plain JS (no React) and scaled way down from a
   typical full-screen particle-sphere use case: a few hundred particles
   and a 64px canvas is plenty at icon size.

   Three.js is ~150KB gzipped — far too much to add to every page's initial
   load for a hover flourish nobody may ever trigger. It's dynamically
   imported on the *first* hover instead, so the cost only lands (once,
   cached thereafter) the moment someone actually interacts with the logo.
   =========================================================================== */

export function initLogoParticles() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = document.querySelector('.logo-icon-wrap');
  const canvas = document.querySelector('.logo-particles');
  if (reduce || !wrap || !canvas) return;

  const SIZE = 64;
  const COUNT = 220;

  let THREE = null;
  let renderer, scene, camera, group;
  let raf = null;
  let hovering = false;
  let loading = false;

  const build = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 2.6;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    // Fibonacci-sphere distribution — evenly spaced points on a sphere
    // surface, same technique the reference component uses.
    const positions = new Float32Array(COUNT * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft round glow sprite, drawn once on an offscreen canvas rather than
    // shipping an image asset for it.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(233,98,36,1)'); // --tangerine
    grad.addColorStop(0.5, 'rgba(233,98,36,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: new THREE.CanvasTexture(sprite),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);
  };

  const tick = () => {
    group.rotation.y += 0.02;
    group.rotation.x += 0.007;
    renderer.render(scene, camera);
    if (hovering) raf = requestAnimationFrame(tick);
  };

  const start = () => {
    hovering = true;
    if (renderer) {
      if (!raf) raf = requestAnimationFrame(tick);
      return;
    }
    if (loading) return;
    loading = true;
    import('three').then((mod) => {
      THREE = mod;
      build();
      // the pointer may already have left while three.js was downloading
      if (hovering) raf = requestAnimationFrame(tick);
    });
  };

  const stop = () => {
    hovering = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  wrap.addEventListener('pointerenter', start);
  wrap.addEventListener('pointerleave', stop);
  wrap.addEventListener('focusin', start);
  wrap.addEventListener('focusout', stop);
}
