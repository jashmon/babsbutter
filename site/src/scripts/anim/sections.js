/* ===========================================================================
   SECTION CHOREOGRAPHY
   One ScrollTrigger timeline per section, each with a deliberately different
   signature so no two sections enter the same way:

     flavours   clip-path wipe + counter-rotate settle
     why        skewY shear that unshears, staggered from the centre outward
     stats      scale punch from below
     made       alternating x-slide with rotation
     recipes    horizontal drift (reads with the carousel)
     ingredients pills pop on an arc, illustrations orbit
     quotes     columns rise at different rates
     shelf      badges cascade, retail chips flip up
     gallery    masonry-ish scale-in from random
     ipanel     clip-path curtain + parallax push
     faq        list shear-in from the left
     cta        blooming scale with rotating shapes
     footer     layered, last-moment reveal

   Plus layered parallax (foreground/mid/background move at different rates)
   and mask reveals for images and video.
   =========================================================================== */
import { gsap, ScrollTrigger, EASE, mm, MQ, inView, reduced, $, $$ } from './core.js';

/* --------------------------------------------------------------------------
   Reusable primitives
   -------------------------------------------------------------------------- */

/** Clip-path wipe: content is revealed rather than faded. */
const clipFrom = (targets, dir = 'up', vars = {}) => {
  const from = {
    up: 'inset(100% 0% 0% 0%)',
    down: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  }[dir];
  return gsap.from(targets, {
    clipPath: from,
    duration: 1.1,
    ease: EASE.out,
    ...vars,
  });
};

/** Scroll-scrubbed parallax. `depth` is px of travel across the whole pass. */
const parallax = (targets, depth = 60, extra = {}) =>
  $$(targets).forEach((el) =>
    gsap.fromTo(
      el,
      { y: depth * 0.5 },
      {
        y: -depth * 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section, header, footer') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
        },
        ...extra,
      }
    )
  );

/* --------------------------------------------------------------------------
   Per-section timelines
   -------------------------------------------------------------------------- */

function flavours() {
  const sec = $('.flavs');
  if (!sec) return;
  const cards = $$('.flav', sec);
  if (!cards.length) return;

  // Each card gets its own independent timeline/trigger rather than sharing
  // one multi-target tween — a single shared tween means a single shared
  // onComplete, so if any one card's stagger slot is ever interrupted
  // (backgrounded tab, a resize mid-flight) the *whole* card set stays
  // uncleared, not just the affected one. Independent per-card timelines
  // mean a hiccup on one card can never strand its neighbours, and each
  // clears its own transform/opacity/clip-path the moment IT finishes.
  // Entrance clears `y` specifically, never the blanket `transform` — the
  // card's hover pop (see ui.js) animates `scale` on this same element, and
  // clearing the whole transform would be able to wipe out a hover that's
  // mid-flight. Scoping to the individual sub-property the entrance actually
  // owns means the two can never step on each other, no matter the timing.
  cards.forEach((card, i) => {
    const ph = card.querySelector('.ph');
    const meta = card.querySelector('.meta');
    gsap
      .timeline({
        scrollTrigger: inView(sec, { start: 'top 70%' }),
        delay: i * 0.09,
        onComplete: () => {
          gsap.set([card, meta], { clearProps: 'y,opacity' });
          gsap.set(ph, { clearProps: 'clipPath' });
        },
      })
      .from(card, { y: 46, opacity: 0, duration: 1, ease: EASE.out })
      .from(ph, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: EASE.out }, 0.05)
      .from(meta, { y: 20, opacity: 0, duration: 0.7 }, 0.32);
  });

  // Belt-and-braces: whatever the cause, no flavour card should ever be
  // left visibly stuck. A short while after the section is first in view,
  // sweep for any card that's still visibly offset from its resting
  // position (read from the actual rendered transform, not from opacity —
  // a card can finish fading in while its translateY is still short of 0,
  // which an opacity-only check would miss entirely) and snap just the `y`
  // back to rest. Correctly-landed cards, and anything hover currently owns
  // (scale/z-index), are left completely alone.
  const settled = (el) => {
    const t = getComputedStyle(el).transform;
    if (t === 'none') return true;
    // the card also carries a 3D hover tilt (see ui.js), which renders as
    // matrix3d(...) rather than matrix(...) the moment any rotateX/rotateY
    // is non-zero — translateY sits at a different index in each form.
    const m3d = t.match(/^matrix3d\(([^)]+)\)$/);
    if (m3d) {
      const ty = m3d[1].split(',').map(Number)[13] ?? 0;
      return Math.abs(ty) < 0.5;
    }
    const m = t.match(/^matrix\(([^)]+)\)$/);
    if (!m) return true;
    const ty = m[1].split(',').map(Number)[5] ?? 0;
    return Math.abs(ty) < 0.5;
  };
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      setTimeout(() => {
        cards.forEach((card) => {
          if (!settled(card)) {
            gsap.set([card, card.querySelector('.meta')], { clearProps: 'y,opacity' });
            gsap.set(card.querySelector('.ph'), { clearProps: 'clipPath' });
          }
        });
      }, 2000);
    },
  });
}

function why() {
  const sec = $('.why');
  if (!sec) return;
  const cards = $$('.why-card', sec);
  if (!cards.length) return;

  const icons = $$('.why-card .ic', sec);
  gsap.timeline({
    scrollTrigger: inView(sec, { start: 'top 72%' }),
    // guaranteed landing at the authored layout, transform-free — without
    // this, anything that interrupts the tween (a backgrounded tab, a fast
    // resize) can strand a card mid-skew.
    onComplete: () => gsap.set([cards, icons], { clearProps: 'transform,opacity' }),
  })
    .from(cards, {
      skewY: 7,
      yPercent: 28,
      opacity: 0,
      duration: 1.05,
      ease: EASE.out,
      stagger: { each: 0.1, from: 'center' },
    })
    .from(icons, { scale: 0.5, rotate: -35, opacity: 0, duration: 0.8, ease: EASE.over, stagger: 0.09 }, 0.2);
}

function stats() {
  const sec = $('.stats');
  if (!sec) return;
  const items = $$('.stat', sec);
  gsap.from(items, {
    scale: 0.72,
    yPercent: 30,
    opacity: 0,
    duration: 1,
    ease: EASE.over,
    stagger: 0.11,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
    onComplete: () => gsap.set(items, { clearProps: 'transform,opacity' }),
  });
}

function made() {
  const sec = $('.made');
  if (!sec) return;
  const steps = $$('.made-step', sec);
  if (!steps.length) return;

  steps.forEach((step, i) => {
    const ph = step.querySelector('.ph');
    const copy = step.querySelectorAll('h3, p, .n');
    gsap.timeline({
      scrollTrigger: inView(step, { start: 'top 80%' }),
      onComplete: () => gsap.set([step, ph, copy], { clearProps: 'transform,opacity,clipPath' }),
    })
      .from(step, {
        xPercent: i % 2 ? 9 : -9,
        rotate: i % 2 ? 2.2 : -2.2,
        opacity: 0,
        duration: 1,
        ease: EASE.out,
      })
      .from(ph, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.14, duration: 1.1, ease: EASE.out }, 0)
      .from(copy, { y: 22, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.25);
  });
}

function recipes() {
  const sec = $('.recipes');
  if (!sec) return;
  const cards = $$('.r-card', sec);
  gsap.from(cards, {
    xPercent: 14,
    opacity: 0,
    rotate: 2.5,
    duration: 1,
    ease: EASE.out,
    stagger: 0.1,
    scrollTrigger: inView(sec, { start: 'top 74%' }),
    onComplete: () => gsap.set(cards, { clearProps: 'transform,opacity' }),
  });
}

function ingredients() {
  const sec = $('.ing');
  if (!sec) return;
  const pills = $$('.ing-stage .pill', sec);
  const floats = $$('.ing-float', sec);
  gsap.timeline({
    scrollTrigger: inView(sec, { start: 'top 72%' }),
    onComplete: () => gsap.set([pills, floats], { clearProps: 'transform,opacity' }),
  })
    .from(pills, {
      scale: 0.6,
      yPercent: 60,
      rotate: (i) => (i - 1) * 9,
      opacity: 0,
      duration: 1.05,
      ease: EASE.over,
      stagger: 0.1,
    })
    .from(
      floats,
      { scale: 0.4, opacity: 0, rotate: -30, duration: 1, ease: EASE.over, stagger: { each: 0.08, from: 'random' } },
      0.1
    );
}

function quotes() {
  const sec = $('.quotes');
  if (!sec) return;
  const head = $$('.q-head > *', sec);
  gsap.from(head, {
    yPercent: 40,
    opacity: 0,
    duration: 0.9,
    ease: EASE.out,
    stagger: 0.08,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
    onComplete: () => gsap.set(head, { clearProps: 'transform,opacity' }),
  });
  // columns rise at slightly different rates — depth without parallax scrub
  $$('.q-col', sec).forEach((col, i) => {
    gsap.from(col, {
      yPercent: 12 + i * 5,
      opacity: 0,
      duration: 1.1 + i * 0.12,
      ease: EASE.soft,
      scrollTrigger: inView(sec, { start: 'top 74%' }),
      onComplete: () => gsap.set(col, { clearProps: 'transform,opacity' }),
    });
  });
}

function shelf() {
  const sec = $('.shelf');
  if (!sec) return;
  const badges = $$('.badges .b', sec);
  const qcoms = $$('.retail .qcom', sec);
  const rowSpans = $$('.retail .row:last-of-type span', sec);
  gsap.timeline({
    scrollTrigger: inView(sec, { start: 'top 74%' }),
    onComplete: () => gsap.set([badges, qcoms, rowSpans], { clearProps: 'transform,opacity' }),
  })
    .from(badges, {
      yPercent: 45,
      opacity: 0,
      rotate: (i) => (i - 1) * 3,
      duration: 0.95,
      ease: EASE.over,
      stagger: 0.09,
    })
    .from(qcoms, { scale: 0.8, opacity: 0, duration: 0.7, ease: EASE.over, stagger: 0.09 }, 0.25)
    .from(rowSpans, { yPercent: 60, opacity: 0, duration: 0.6, stagger: 0.045 }, 0.35);
}

function gallery() {
  const grid = $('.gal-grid');
  if (!grid) return;
  const originals = $$('.g', grid);
  if (!originals.length) return;

  // Auto-rotating filmstrip: wrap the frames in their own track and duplicate
  // the set once, so there's a seamless second copy to hand off to. Structural,
  // so it happens once regardless of breakpoint or motion preference.
  const track = document.createElement('div');
  track.className = 'gal-track';
  grid.insertBefore(track, originals[0]);
  originals.forEach((el) => track.appendChild(el));
  originals.forEach((el) => track.appendChild(el.cloneNode(true)));

  // Self-contained motion context: reruns (and cleanly reverts) on its own
  // whenever prefers-reduced-motion changes, independent of the desktop/
  // tablet/mobile split above.
  mm.add(MQ.motion, () => {
    // frames drift in from the right, reading as a filmstrip already in
    // motion rather than a grid popping into place
    gsap.from(originals, {
      xPercent: 16,
      opacity: 0,
      scale: 0.94,
      duration: 0.95,
      ease: EASE.out,
      stagger: 0.08,
      scrollTrigger: inView(grid, { start: 'top 82%' }),
      onComplete: () => gsap.set(originals, { clearProps: 'transform,opacity' }),
    });

    // Distance is measured as the real on-screen offset of the first
    // duplicate rather than computed from widths/gaps — the same rect-diff
    // trick the nav pill needed, for the same reason: width/gap math drifts
    // by fractions of a pixel and shows up as a visible hitch at the seam.
    const play = () => {
      const trackRect = track.getBoundingClientRect();
      const firstClone = track.children[originals.length];
      const distance = firstClone.getBoundingClientRect().left - trackRect.left;
      if (!distance) return null;
      return gsap.to(track, {
        x: `-=${distance}`,
        duration: distance / 50,
        ease: 'none',
        repeat: -1,
        modifiers: { x: gsap.utils.unitize((x) => parseFloat(x) % distance) },
      });
    };

    let tween = play();
    const onEnter = () => tween?.pause();
    const onLeave = () => tween?.resume();
    const onResize = () => {
      tween?.kill();
      gsap.set(track, { x: 0 });
      tween = play();
    };
    grid.addEventListener('pointerenter', onEnter);
    grid.addEventListener('pointerleave', onLeave);
    addEventListener('resize', onResize);

    // The filmstrip has no reason to keep animating (and costing a tick of
    // work every frame, forever) while it's nowhere near the viewport —
    // pause it off-screen the same way a video element would.
    const visTrigger = ScrollTrigger.create({
      trigger: grid,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => tween?.resume(),
      onLeave: () => tween?.pause(),
      onEnterBack: () => tween?.resume(),
      onLeaveBack: () => tween?.pause(),
    });

    return () => {
      grid.removeEventListener('pointerenter', onEnter);
      grid.removeEventListener('pointerleave', onLeave);
      removeEventListener('resize', onResize);
      visTrigger.kill();
      tween?.kill();
      gsap.set(track, { clearProps: 'transform' });
    };
  });
}

function photoPanel() {
  $$('.ipanel, .pb-panel').forEach((panel) => {
    const img = panel.querySelector('img');
    const txt = panel.querySelector('.txt, .pb-panel-txt');

    gsap.timeline({ scrollTrigger: inView(panel, { start: 'top 82%' }) })
      .from(panel, { clipPath: 'inset(14% 8% 14% 8% round 40px)', duration: 1.3, ease: EASE.out })
      .from(txt ? txt.children : [], { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.35);

    // slow push behind the copy
    if (img) {
      gsap.fromTo(
        img,
        { scale: 1.18, yPercent: -4 },
        {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        }
      );
    }
  });
}

function faq() {
  const sec = $('.faq') || $('.pb-faq');
  if (!sec) return;
  const items = $$('details', sec);
  gsap.from(items, {
    xPercent: -4,
    skewY: 2.5,
    opacity: 0,
    duration: 0.85,
    ease: EASE.out,
    stagger: 0.08,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
    // details cards must land with zero leftover transform — a stray skew
    // reads as a badly broken layout, not a subtle motion cue.
    onComplete: () => gsap.set(items, { clearProps: 'transform,opacity' }),
  });
  const side = sec.querySelector('.faq-side');
  if (side) {
    const kids = [...side.children];
    gsap.from(kids, {
      x: -26,
      opacity: 0,
      duration: 0.9,
      ease: EASE.out,
      stagger: 0.1,
      scrollTrigger: inView(sec, { start: 'top 78%' }),
      onComplete: () => gsap.set(kids, { clearProps: 'transform,opacity' }),
    });
  }
}

function ctaSection() {
  const sec = $('.cta') || $('.pb-cta');
  if (!sec) return;
  const shapes = $$('.q, .f, .pb-cta-shape', sec);

  const wrap = sec.querySelector('.wrap');
  gsap.timeline({
    scrollTrigger: inView(sec, { start: 'top 78%' }),
    // clearing rotate here is safe even though the shapes are rotated — the
    // scrub tween below owns rotation continuously and repaints it on the
    // very next scroll tick.
    onComplete: () => gsap.set([wrap, shapes], { clearProps: 'transform,opacity' }),
  })
    .from(wrap, { scale: 0.94, opacity: 0, duration: 1.1, ease: EASE.out })
    .from(shapes, { scale: 0.5, rotate: -50, opacity: 0, duration: 1.3, ease: EASE.over, stagger: 0.12 }, 0.1);

  // shapes keep turning slowly with scroll
  shapes.forEach((s, i) =>
    gsap.to(s, {
      rotate: i % 2 ? 26 : -26,
      ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    })
  );
}

// Footer intentionally has NO text animation. Arriving at the bottom of a
// long page should feel like settling, not like another reveal firing — and
// animating the link columns made the last screen feel busy.
/* --- plant-based page ----------------------------------------------------- */
function plantPage() {
  const ben = $('.pb-ben-grid');
  if (ben) {
    const cards = $$('.pb-ben', ben);
    const icons = $$('.pb-ben-ic', ben);
    gsap.from(cards, {
      yPercent: 26,
      opacity: 0,
      scale: 0.93,
      rotate: (i) => (i % 2 ? 3 : -3),
      duration: 1,
      ease: EASE.over,
      stagger: 0.09,
      scrollTrigger: inView(ben, { start: 'top 78%' }),
      onComplete: () => gsap.set(cards, { clearProps: 'transform,opacity' }),
    });
    gsap.from(icons, {
      scale: 0.4,
      rotate: -40,
      opacity: 0,
      duration: 0.9,
      ease: EASE.over,
      stagger: 0.09,
      scrollTrigger: inView(ben, { start: 'top 76%' }),
      onComplete: () => gsap.set(icons, { clearProps: 'transform,opacity' }),
    });
  }

  $$('.pb-step').forEach((step, i) => {
    const ph = step.querySelector('.pb-step-ph');
    const copy = step.querySelectorAll('.pb-step-n, h3, p');
    gsap.timeline({
      scrollTrigger: inView(step, { start: 'top 80%' }),
      onComplete: () => gsap.set([ph, copy], { clearProps: 'transform,opacity,clipPath' }),
    })
      .from(ph, {
        clipPath: 'inset(0% 0% 100% 0%)',
        scale: 1.1,
        rotate: i % 2 ? 3 : -3,
        duration: 1.15,
        ease: EASE.out,
      })
      .from(copy, { y: 24, opacity: 0, duration: 0.75, stagger: 0.08 }, 0.28);
  });

  const uses = $('.pb-use-grid');
  if (uses) {
    const cards = $$('.pb-use', uses);
    gsap.from(cards, {
      yPercent: 40,
      opacity: 0,
      skewY: 4,
      duration: 0.9,
      ease: EASE.out,
      stagger: 0.08,
      scrollTrigger: inView(uses, { start: 'top 80%' }),
      onComplete: () => gsap.set(cards, { clearProps: 'transform,opacity' }),
    });
  }

  const statement = $('.pb-statement');
  if (statement) {
    const p = statement.querySelector('p');
    gsap.from(p, {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: EASE.out,
      scrollTrigger: inView(statement, { start: 'top 78%' }),
      onComplete: () => gsap.set(p, { clearProps: 'transform,opacity' }),
    });
  }
}

/* --- video ---------------------------------------------------------------- */
function videos() {
  $$('.vid').forEach((sec) => {
    const v = sec.querySelector('video');
    if (!v) return;
    gsap.from(sec, {
      clipPath: 'inset(18% 10% 18% 10% round 48px)',
      duration: 1.4,
      ease: EASE.out,
      scrollTrigger: inView(sec, { start: 'top 84%' }),
    });
    gsap.fromTo(
      v,
      { scale: 1.16 },
      {
        scale: 1.02,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      }
    );
    const tag = sec.querySelector('.tag');
    if (tag) {
      gsap.from(tag, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: EASE.over,
        scrollTrigger: inView(sec, { start: 'top 70%' }),
        onComplete: () => gsap.set(tag, { clearProps: 'transform,opacity' }),
      });
    }
  });

  // hero background video: slow drift so the "about" band never feels static
  const bg = $('.about .bgvid');
  if (bg) {
    gsap.fromTo(
      bg,
      { scale: 1.08, yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1.3 },
      }
    );
  }
}

/* --- decorative SVG ------------------------------------------------------- */
function decorations() {
  // brand shapes breathe and turn slowly, at individually offset phases so the
  // page never pulses in unison — paused off-screen so a page with several
  // of these isn't paying a per-frame cost for shapes nobody can see
  $$('.blob').forEach((el, i) => {
    const breathe = gsap.to(el, {
      rotate: i % 2 ? 14 : -14,
      scale: 1.05,
      duration: 9 + i * 1.7,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.4,
    });
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => breathe.resume(),
      onLeave: () => breathe.pause(),
      onEnterBack: () => breathe.resume(),
      onLeaveBack: () => breathe.pause(),
    });
  });

  // illustrations drift with scroll at varied depths (foreground layer)
  $$('.float-i, .ing-float, .pb-float').forEach((el, i) => {
    gsap.to(el, {
      y: (i % 3 === 0 ? -70 : i % 3 === 1 ? -110 : -45),
      rotate: i % 2 ? 10 : -10,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section, header') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.4,
      },
    });
  });
}

/* --- hero/reprise ticker banner --------------------------------------------
   The old CSS `@keyframes` loop moved the track to translateX(-50%), which is
   only a correct halfway point when the gap between the two authored copies
   happens to divide evenly into the total width — off by even a few
   sub-pixels and the loop visibly hitches or "restarts" at the seam, which is
   exactly what was reported. Handing the loop to GSAP with a measured pixel
   distance (rect-diff, not a percentage) and a modulo wrap makes the seam
   pixel-perfect and genuinely endless. The CSS animation is switched off so
   the two never fight over the same transform. */
function marquee() {
  const tracks = $$('.mq .track');
  if (!tracks.length) return;

  mm.add(MQ.motion, () => {
    const cleanups = [];

    tracks.forEach((track) => {
      const spans = $$('span', track);
      if (spans.length < 2) return;

      track.style.animation = 'none';
      gsap.set(track, { x: 0 });

      const trackRect = track.getBoundingClientRect();
      const distance = spans[1].getBoundingClientRect().left - trackRect.left;
      if (!distance) return;

      const tween = gsap.to(track, {
        x: `-=${distance}`,
        duration: distance / 55,
        ease: 'none',
        repeat: -1,
        modifiers: { x: gsap.utils.unitize((x) => parseFloat(x) % distance) },
      });

      // Same reasoning as the gallery filmstrip: don't keep paying for a
      // per-frame tick on a band that's scrolled well out of view.
      const band = track.closest('.mq') || track;
      const visTrigger = ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => tween.resume(),
        onLeave: () => tween.pause(),
        onEnterBack: () => tween.resume(),
        onLeaveBack: () => tween.pause(),
      });

      cleanups.push(() => {
        visTrigger.kill();
        tween.kill();
        track.style.animation = '';
        gsap.set(track, { clearProps: 'transform' });
      });
    });

    return () => cleanups.forEach((fn) => fn());
  });
}

/* --------------------------------------------------------------------------
   init
   -------------------------------------------------------------------------- */
export function initSections() {
  // Breakpoint- and motion-independent: these manage their own lifecycle
  // internally (each wraps its own mm.add), so they run once, not once per
  // outer breakpoint block below.
  gallery();
  marquee();

  // Full cinematic pass — desktop and tablet.
  mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
    flavours();
    why();
    stats();
    made();
    recipes();
    ingredients();
    quotes();
    shelf();
    photoPanel();
    faq();
    ctaSection();
    plantPage();
    videos();
    decorations();

    // layered parallax: background decoration moves most, content least
    parallax('.gal-grid .g', 46);
    parallax('.made-step .ph', 34);

    // No manual teardown: gsap.matchMedia() reverts every animation and
    // ScrollTrigger created inside this context automatically. Killing them by
    // hand here also destroyed the other breakpoint's triggers (and the text /
    // counter ones), which is what stranded cards mid-entrance on resize.
  });

  // Mobile: same language, less work. No scrubbed parallax (it's the most
  // expensive thing on a phone), shorter travel, entrances only.
  mm.add(MQ.mobile, () => {
    flavours();
    why();
    stats();
    made();
    recipes();
    ingredients();
    quotes();
    shelf();
    photoPanel();
    faq();
    ctaSection();
    plantPage();

    // No manual teardown: gsap.matchMedia() reverts every animation and
    // ScrollTrigger created inside this context automatically. Killing them by
    // hand here also destroyed the other breakpoint's triggers (and the text /
    // counter ones), which is what stranded cards mid-entrance on resize.
  });

  // Reduced motion: everything is already at its natural state; nothing to do.
}
