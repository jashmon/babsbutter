// Concept 7 · "Butter Playground" behaviour.
// Everything here is transform/opacity only and degrades cleanly:
//  - reveal-on-scroll (.rv -> .in), with an in-viewport "no-anim" fast path
//  - count-up statistics
//  - a soft cursor blob that eases toward the pointer (rAF-batched)
//  - magnetic buttons (.magnetic)
// The blob + magnetic effects, plus all motion, are disabled under
// prefers-reduced-motion; content stays fully visible either way.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- reveal on scroll -------------------------------------------------------
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.14 }
);

document.querySelectorAll('.rv').forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) {
    // Already on screen at load: show immediately without the entrance animation.
    el.classList.add('no-anim', 'in');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('no-anim')));
  } else {
    io.observe(el);
  }
});

// ---- count-up numbers -------------------------------------------------------
const cio = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const target = +e.target.dataset.count;
      if (reduce) {
        e.target.textContent = String(target);
        return;
      }
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - t0) / 1200);
        e.target.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }),
  { threshold: 0.6 }
);
document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

// ---- pointer flourishes (motion only) --------------------------------------
if (!reduce) {
  // soft cursor blob (transform-only, rAF-batched)
  const blob = document.getElementById('blob');
  if (blob) {
    let tx = innerWidth / 2,
      ty = innerHeight / 2,
      bx = tx,
      by = ty,
      raf = null;
    blob.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
    const loop = () => {
      bx += (tx - bx) * 0.12;
      by += (ty - by) * 0.12;
      blob.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
      if (Math.abs(tx - bx) > 0.5 || Math.abs(ty - by) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) loop();
    });
  }

  // magnetic buttons
  document.querySelectorAll('.magnetic').forEach((b) => {
    let pending = null;
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      if (!pending)
        pending = requestAnimationFrame(() => {
          b.style.transform = `translate(${x * 0.3}px,${y * 0.3}px)`;
          pending = null;
        });
    });
    b.addEventListener('pointerleave', () => {
      b.style.transform = '';
    });
  });
}
