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
import { gsap, ScrollTrigger, EASE, mm, MQ, inView, $, $$ } from './core.js';

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

  gsap.set(cards, { transformPerspective: 900 });
  gsap.timeline({ scrollTrigger: inView(sec, { start: 'top 70%' }) })
    .from(cards, {
      yPercent: 22,
      opacity: 0,
      rotate: (i) => (i % 2 ? 4 : -4),
      scale: 0.92,
      duration: 1.05,
      ease: EASE.over,
      stagger: 0.09,
    })
    .from(
      $$('.flav .ph', sec),
      { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: EASE.out, stagger: 0.09 },
      0.05
    )
    .from(
      $$('.flav .meta', sec),
      { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 },
      0.32
    );
}

function why() {
  const sec = $('.why');
  if (!sec) return;
  const cards = $$('.why-card', sec);
  if (!cards.length) return;

  gsap.timeline({ scrollTrigger: inView(sec, { start: 'top 72%' }) })
    .from(cards, {
      skewY: 7,
      yPercent: 28,
      opacity: 0,
      duration: 1.05,
      ease: EASE.out,
      stagger: { each: 0.1, from: 'center' },
    })
    .from($$('.why-card .ic', sec), { scale: 0.5, rotate: -35, opacity: 0, duration: 0.8, ease: EASE.over, stagger: 0.09 }, 0.2);
}

function stats() {
  const sec = $('.stats');
  if (!sec) return;
  gsap.from($$('.stat', sec), {
    scale: 0.72,
    yPercent: 30,
    opacity: 0,
    duration: 1,
    ease: EASE.over,
    stagger: 0.11,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
  });
}

function made() {
  const sec = $('.made');
  if (!sec) return;
  const steps = $$('.made-step', sec);
  if (!steps.length) return;

  steps.forEach((step, i) => {
    gsap.timeline({ scrollTrigger: inView(step, { start: 'top 80%' }) })
      .from(step, {
        xPercent: i % 2 ? 9 : -9,
        rotate: i % 2 ? 2.2 : -2.2,
        opacity: 0,
        duration: 1,
        ease: EASE.out,
      })
      .from(step.querySelector('.ph'), { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.14, duration: 1.1, ease: EASE.out }, 0)
      .from(step.querySelectorAll('h3, p, .n'), { y: 22, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.25);
  });
}

function recipes() {
  const sec = $('.recipes');
  if (!sec) return;
  gsap.from($$('.r-card', sec), {
    xPercent: 14,
    opacity: 0,
    rotate: 2.5,
    duration: 1,
    ease: EASE.out,
    stagger: 0.1,
    scrollTrigger: inView(sec, { start: 'top 74%' }),
  });
}

function ingredients() {
  const sec = $('.ing');
  if (!sec) return;
  gsap.timeline({ scrollTrigger: inView(sec, { start: 'top 72%' }) })
    .from($$('.ing-stage .pill', sec), {
      scale: 0.6,
      yPercent: 60,
      rotate: (i) => (i - 1) * 9,
      opacity: 0,
      duration: 1.05,
      ease: EASE.over,
      stagger: 0.1,
    })
    .from(
      $$('.ing-float', sec),
      { scale: 0.4, opacity: 0, rotate: -30, duration: 1, ease: EASE.over, stagger: { each: 0.08, from: 'random' } },
      0.1
    );
}

function quotes() {
  const sec = $('.quotes');
  if (!sec) return;
  gsap.from($$('.q-head > *', sec), {
    yPercent: 40,
    opacity: 0,
    duration: 0.9,
    ease: EASE.out,
    stagger: 0.08,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
  });
  // columns rise at slightly different rates — depth without parallax scrub
  $$('.q-col', sec).forEach((col, i) => {
    gsap.from(col, {
      yPercent: 12 + i * 5,
      opacity: 0,
      duration: 1.1 + i * 0.12,
      ease: EASE.soft,
      scrollTrigger: inView(sec, { start: 'top 74%' }),
    });
  });
}

function shelf() {
  const sec = $('.shelf');
  if (!sec) return;
  gsap.timeline({ scrollTrigger: inView(sec, { start: 'top 74%' }) })
    .from($$('.badges .b', sec), {
      yPercent: 45,
      opacity: 0,
      rotate: (i) => (i - 1) * 3,
      duration: 0.95,
      ease: EASE.over,
      stagger: 0.09,
    })
    .from($$('.retail .qcom', sec), { scale: 0.8, opacity: 0, duration: 0.7, ease: EASE.over, stagger: 0.09 }, 0.25)
    .from($$('.retail .row:last-of-type span', sec), { yPercent: 60, opacity: 0, duration: 0.6, stagger: 0.045 }, 0.35);
}

function gallery() {
  const grid = $('.gal-grid');
  if (!grid) return;
  gsap.from($$('.g', grid), {
    scale: 0.82,
    opacity: 0,
    yPercent: 16,
    duration: 1,
    ease: EASE.out,
    stagger: { each: 0.07, from: 'random' },
    scrollTrigger: inView(grid, { start: 'top 80%' }),
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
  gsap.from($$('details', sec), {
    xPercent: -4,
    skewY: 2.5,
    opacity: 0,
    duration: 0.85,
    ease: EASE.out,
    stagger: 0.08,
    scrollTrigger: inView(sec, { start: 'top 76%' }),
  });
  const side = sec.querySelector('.faq-side');
  if (side) {
    gsap.from(side.children, {
      x: -26,
      opacity: 0,
      duration: 0.9,
      ease: EASE.out,
      stagger: 0.1,
      scrollTrigger: inView(sec, { start: 'top 78%' }),
    });
  }
}

function ctaSection() {
  const sec = $('.cta') || $('.pb-cta');
  if (!sec) return;
  const shapes = $$('.q, .f, .pb-cta-shape', sec);

  gsap.timeline({ scrollTrigger: inView(sec, { start: 'top 78%' }) })
    .from(sec.querySelector('.wrap'), { scale: 0.94, opacity: 0, duration: 1.1, ease: EASE.out })
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

function footer() {
  const f = $('footer');
  if (!f) return;
  // deliberately late — the footer should feel like an arrival, not a preview
  gsap.timeline({ scrollTrigger: inView(f, { start: 'top 92%' }) })
    .from(f.querySelector('.f-grid > div:first-child'), { y: 34, opacity: 0, duration: 0.9, ease: EASE.out })
    .from($$('.f-grid > div:not(:first-child)', f), { y: 26, opacity: 0, duration: 0.75, stagger: 0.09 }, 0.12)
    .from($$('.f-grid ul li', f), { y: 14, opacity: 0, duration: 0.5, stagger: 0.03 }, 0.22)
    .from(f.querySelector('.f-base'), { opacity: 0, y: 16, duration: 0.7 }, 0.42);
}

/* --- plant-based page ----------------------------------------------------- */
function plantPage() {
  const ben = $('.pb-ben-grid');
  if (ben) {
    gsap.from($$('.pb-ben', ben), {
      yPercent: 26,
      opacity: 0,
      scale: 0.93,
      rotate: (i) => (i % 2 ? 3 : -3),
      duration: 1,
      ease: EASE.over,
      stagger: 0.09,
      scrollTrigger: inView(ben, { start: 'top 78%' }),
    });
    gsap.from($$('.pb-ben-ic', ben), {
      scale: 0.4,
      rotate: -40,
      opacity: 0,
      duration: 0.9,
      ease: EASE.over,
      stagger: 0.09,
      scrollTrigger: inView(ben, { start: 'top 76%' }),
    });
  }

  $$('.pb-step').forEach((step, i) => {
    gsap.timeline({ scrollTrigger: inView(step, { start: 'top 80%' }) })
      .from(step.querySelector('.pb-step-ph'), {
        clipPath: 'inset(0% 0% 100% 0%)',
        scale: 1.1,
        rotate: i % 2 ? 3 : -3,
        duration: 1.15,
        ease: EASE.out,
      })
      .from(step.querySelectorAll('.pb-step-n, h3, p'), { y: 24, opacity: 0, duration: 0.75, stagger: 0.08 }, 0.28);
  });

  const uses = $('.pb-use-grid');
  if (uses) {
    gsap.from($$('.pb-use', uses), {
      yPercent: 40,
      opacity: 0,
      skewY: 4,
      duration: 0.9,
      ease: EASE.out,
      stagger: 0.08,
      scrollTrigger: inView(uses, { start: 'top 80%' }),
    });
  }

  const statement = $('.pb-statement');
  if (statement) {
    gsap.from(statement.querySelector('p'), {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: EASE.out,
      scrollTrigger: inView(statement, { start: 'top 78%' }),
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
  // page never pulses in unison
  $$('.blob').forEach((el, i) => {
    gsap.to(el, {
      rotate: i % 2 ? 14 : -14,
      scale: 1.05,
      duration: 9 + i * 1.7,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.4,
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

/* --------------------------------------------------------------------------
   init
   -------------------------------------------------------------------------- */
export function initSections() {
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
    gallery();
    photoPanel();
    faq();
    ctaSection();
    footer();
    plantPage();
    videos();
    decorations();

    // layered parallax: background decoration moves most, content least
    parallax('.gal-grid .g', 46);
    parallax('.made-step .ph', 34);

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
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
    gallery();
    photoPanel();
    faq();
    ctaSection();
    footer();
    plantPage();

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  });

  // Reduced motion: everything is already at its natural state; nothing to do.
}
