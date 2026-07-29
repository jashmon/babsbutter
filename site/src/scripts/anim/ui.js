/* ===========================================================================
   UI MOTION — cursor, buttons, cards, counters
   All pointer work runs through gsap.quickTo(), which caches the setter and
   avoids re-creating a tween per event. That's the difference between a
   cursor that tracks smoothly and one that stutters under load.
   =========================================================================== */
import { gsap, EASE, mm, MQ, inView, reduced, $, $$ } from './core.js';

/* --------------------------------------------------------------------------
   CURSOR
   Inertial follow, with velocity-driven stretch: the blob elongates along its
   direction of travel and compresses back to a circle when it settles.
   -------------------------------------------------------------------------- */
export function initCursor() {
  mm.add(MQ.pointer, () => {
    const blob = $('#blob');
    if (!blob) return;

    gsap.set(blob, { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });

    const xTo = gsap.quickTo(blob, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(blob, 'y', { duration: 0.5, ease: 'power3' });
    const rotTo = gsap.quickTo(blob, 'rotate', { duration: 0.5, ease: 'power3' });
    const sxTo = gsap.quickTo(blob, 'scaleX', { duration: 0.55, ease: 'power3' });
    const syTo = gsap.quickTo(blob, 'scaleY', { duration: 0.55, ease: 'power3' });

    let px = innerWidth / 2;
    let py = innerHeight / 2;
    let idle;

    const onMove = (e) => {
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;

      xTo(px);
      yTo(py);

      // stretch along travel, capped so fast flicks don't distort absurdly
      const speed = Math.min(Math.hypot(dx, dy), 90);
      const s = speed / 90;
      rotTo((Math.atan2(dy, dx) * 180) / Math.PI);
      sxTo(1 + s * 0.42);
      syTo(1 - s * 0.26);

      // compress back to a circle once the pointer stops
      clearTimeout(idle);
      idle = setTimeout(() => {
        sxTo(1);
        syTo(1);
      }, 90);
    };

    addEventListener('pointermove', onMove, { passive: true });

    // grow + shift blend over interactive targets
    const targets = $$('a, button, .btn, summary, .flav, .why-card, .r-card, .q-card, .g');
    const enter = () => gsap.to(blob, { scale: 1.55, opacity: 0.75, duration: 0.45, ease: EASE.out });
    const leave = () => gsap.to(blob, { scale: 1, opacity: 1, duration: 0.45, ease: EASE.out });
    targets.forEach((t) => {
      t.addEventListener('pointerenter', enter);
      t.addEventListener('pointerleave', leave);
    });

    return () => {
      removeEventListener('pointermove', onMove);
      clearTimeout(idle);
      targets.forEach((t) => {
        t.removeEventListener('pointerenter', enter);
        t.removeEventListener('pointerleave', leave);
      });
      gsap.set(blob, { clearProps: 'all' });
    };
  });
}

/* --------------------------------------------------------------------------
   BUTTONS
   Magnetic attraction + label counter-move (the label lags the pill slightly,
   which is what sells the "weight"), plus a shine sweep and a press state.
   -------------------------------------------------------------------------- */
export function initButtons() {
  // Shine element is injected rather than authored into every template, so
  // markup stays untouched.
  $$('.btn').forEach((b) => {
    if (b.querySelector('.btn-shine')) return;
    const shine = document.createElement('span');
    shine.className = 'btn-shine';
    shine.setAttribute('aria-hidden', 'true');
    b.appendChild(shine);
  });

  mm.add(MQ.pointer, () => {
    const cleanups = [];

    $$('.btn').forEach((b) => {
      const shine = b.querySelector('.btn-shine');
      const label = b.firstChild && b.firstChild.nodeType === 3 ? null : null;

      const xTo = gsap.quickTo(b, 'x', { duration: 0.55, ease: 'power3' });
      const yTo = gsap.quickTo(b, 'y', { duration: 0.55, ease: 'power3' });

      // magnetic only for buttons opted in; the rest still get lift/shine
      const magnetic = b.classList.contains('magnetic');

      const onMove = (e) => {
        if (!magnetic) return;
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.32);
        yTo((e.clientY - r.top - r.height / 2) * 0.32);
      };

      const onEnter = () => {
        gsap.to(b, { scale: 1.045, duration: 0.5, ease: EASE.over });
        if (shine) {
          gsap.fromTo(
            shine,
            { xPercent: -130, opacity: 0 },
            { xPercent: 130, opacity: 1, duration: 0.85, ease: 'power2.inOut' }
          );
        }
      };

      const onLeave = () => {
        xTo(0);
        yTo(0);
        gsap.to(b, { scale: 1, duration: 0.6, ease: EASE.out });
      };

      const onDown = () => gsap.to(b, { scale: 0.965, duration: 0.16, ease: 'power2.out' });
      const onUp = () => gsap.to(b, { scale: 1.045, duration: 0.45, ease: EASE.over });

      b.addEventListener('pointermove', onMove);
      b.addEventListener('pointerenter', onEnter);
      b.addEventListener('pointerleave', onLeave);
      b.addEventListener('pointerdown', onDown);
      b.addEventListener('pointerup', onUp);

      cleanups.push(() => {
        b.removeEventListener('pointermove', onMove);
        b.removeEventListener('pointerenter', onEnter);
        b.removeEventListener('pointerleave', onLeave);
        b.removeEventListener('pointerdown', onDown);
        b.removeEventListener('pointerup', onUp);
        gsap.set(b, { clearProps: 'transform' });
      });
    });

    return () => cleanups.forEach((fn) => fn());
  });

  // Touch: a crisp press instead of hover choreography.
  mm.add('(hover: none)', () => {
    const onDown = (e) => {
      const b = e.target.closest('.btn');
      if (b) gsap.to(b, { scale: 0.97, duration: 0.14 });
    };
    const onUp = (e) => {
      const b = e.target.closest('.btn');
      if (b) gsap.to(b, { scale: 1, duration: 0.35, ease: EASE.over });
    };
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
    };
  });
}

/* --------------------------------------------------------------------------
   CARDS
   Hover choreography where the children move independently of the shell —
   the card lifts and tilts toward the cursor while the icon, title and media
   each travel their own distance. That parallax-within-a-card is what reads
   as depth rather than a scale transform.
   -------------------------------------------------------------------------- */
export function initCards() {
  mm.add(MQ.pointer, () => {
    const cleanups = [];

    const wire = (card, opts) => {
      const { media, icon, title, lift = 10, tilt = 5, mediaShift = 12 } = opts;

      gsap.set(card, { transformPerspective: 900, transformStyle: 'preserve-3d' });

      const rx = gsap.quickTo(card, 'rotateX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotateY', { duration: 0.6, ease: 'power3' });
      const mx = media ? gsap.quickTo(media, 'x', { duration: 0.7, ease: 'power3' }) : null;
      const my = media ? gsap.quickTo(media, 'y', { duration: 0.7, ease: 'power3' }) : null;

      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * tilt * 2);
        rx(-ny * tilt * 2);
        if (mx) {
          mx(nx * mediaShift);
          my(ny * mediaShift);
        }
      };

      const onEnter = () => {
        gsap.to(card, { y: -lift, duration: 0.55, ease: EASE.out });
        if (icon) gsap.to(icon, { rotate: -10, scale: 1.14, duration: 0.6, ease: EASE.over });
        if (title) gsap.to(title, { x: 4, duration: 0.5, ease: EASE.out });
      };

      const onLeave = () => {
        rx(0);
        ry(0);
        if (mx) {
          mx(0);
          my(0);
        }
        gsap.to(card, { y: 0, duration: 0.7, ease: EASE.out });
        if (icon) gsap.to(icon, { rotate: 0, scale: 1, duration: 0.6, ease: EASE.out });
        if (title) gsap.to(title, { x: 0, duration: 0.5, ease: EASE.out });
      };

      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerenter', onEnter);
      card.addEventListener('pointerleave', onLeave);

      cleanups.push(() => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
        gsap.set([card, media, icon, title].filter(Boolean), { clearProps: 'transform' });
      });
    };

    $$('.why-card').forEach((c) =>
      wire(c, { icon: c.querySelector('.ic'), title: c.querySelector('h3'), lift: 12 })
    );
    $$('.r-card').forEach((c) =>
      wire(c, { media: c.querySelector('.ph img'), lift: 10, mediaShift: 16 })
    );
    $$('.q-card').forEach((c) => wire(c, { lift: 8, tilt: 3.5 }));
    $$('.pb-ben').forEach((c) =>
      wire(c, { icon: c.querySelector('.pb-ben-ic'), title: c.querySelector('h3'), lift: 12 })
    );
    $$('.pb-use').forEach((c) => wire(c, { lift: 8, tilt: 3.5 }));
    $$('.gal-grid .g').forEach((c) => wire(c, { media: c.querySelector('img'), lift: 6, mediaShift: 14 }));

    /* Product cards: the whole card — blob plus label — pops to 1.5x as one
       unit and lifts above its neighbours (the original reference "pop"),
       with a light cursor-tilt and the tub leaning inside its blob layered
       on top for depth. z-index is restored only after the shrink-back
       finishes, so the card stays on top for the whole exit instead of
       dropping behind its neighbours mid-shrink. */
    $$('.flav').forEach((card) => {
      const tub = card.querySelector('.ph img');
      const meta = card.querySelector('.meta');
      const chip = card.querySelector('.chip');

      gsap.set(card, { transformPerspective: 1000 });
      const ry = gsap.quickTo(card, 'rotateY', { duration: 0.65, ease: 'power3' });
      const rx = gsap.quickTo(card, 'rotateX', { duration: 0.65, ease: 'power3' });
      const tx = tub ? gsap.quickTo(tub, 'x', { duration: 0.8, ease: 'power3' }) : null;
      const ty = tub ? gsap.quickTo(tub, 'y', { duration: 0.8, ease: 'power3' }) : null;

      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 10);
        rx(-ny * 10);
        if (tx) {
          tx(nx * 16);
          ty(ny * 16);
        }
      };
      const onEnter = () => {
        gsap.set(card, { zIndex: 5 });
        gsap.to(card, { scale: 1.5, duration: 0.42, ease: EASE.out, overwrite: 'auto' });
        gsap.to(meta, { y: -6, duration: 0.55, ease: EASE.out });
        if (chip) gsap.to(chip, { scale: 1.3, duration: 0.6, ease: EASE.over });
      };
      const onLeave = () => {
        rx(0);
        ry(0);
        if (tx) {
          tx(0);
          ty(0);
        }
        gsap.to(card, {
          scale: 1,
          duration: 0.42,
          ease: EASE.out,
          overwrite: 'auto',
          onComplete: () => gsap.set(card, { zIndex: 1 }),
        });
        gsap.to(meta, { y: 0, duration: 0.6, ease: EASE.out });
        if (chip) gsap.to(chip, { scale: 1, duration: 0.6, ease: EASE.out });
      };

      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerenter', onEnter);
      card.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
        gsap.set([card, tub, meta, chip].filter(Boolean), { clearProps: 'transform,zIndex' });
      });
    });

    return () => cleanups.forEach((fn) => fn());
  });
}

/* --------------------------------------------------------------------------
   COUNTERS
   Rolling digits with a scale punch as they land.
   -------------------------------------------------------------------------- */
export function initCounters() {
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;

    // Reduced motion: show the figure, don't roll or punch it.
    if (reduced) {
      el.textContent = String(target);
      return;
    }

    const obj = { v: 0 };

    gsap.timeline({ scrollTrigger: inView(el, { start: 'top 86%' }) })
      .to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = String(Math.round(obj.v));
        },
      })
      .from(el, { scale: 0.7, opacity: 0, duration: 0.9, ease: EASE.over }, 0)
      // a small settle punch exactly as the number lands
      .to(el, { scale: 1.08, duration: 0.18, ease: 'power2.out' }, 1.5)
      .to(el, { scale: 1, duration: 0.5, ease: EASE.over });
  });
}
