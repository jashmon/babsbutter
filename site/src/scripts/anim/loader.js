/* ===========================================================================
   PAGE LOAD
   One master timeline: logo → cover morph away → headline → decoration →
   buttons → media → navigation → scroll released.

   Beats overlap deliberately (negative position offsets). A strictly
   sequential loader feels like a progress bar; overlapping reads as
   choreography. Scroll stays locked via Lenis until the timeline is far
   enough along that the hero is legible.
   =========================================================================== */
import { gsap, ScrollTrigger, EASE, lenis, reduced, $, $$ } from './core.js';
import { splitHeading, splitLines } from './text.js';

const MIN_HOLD = 0.5; // seconds the mark is guaranteed to be on screen

export function runLoader() {
  const pre = $('#preloader');
  const hero = $('.hero') || $('.pb-hero');

  // Reduced motion: no cinematic intro at all, just get out of the way.
  if (reduced) {
    pre?.remove();
    lenis?.start();
    return gsap.timeline();
  }

  lenis?.stop();

  const heroH1 = hero?.querySelector('h1');
  const heroP = hero?.querySelector('p');
  const eyebrow = hero?.querySelector('.eyebrow, .pb-eyebrow');
  const buttons = hero ? $$('.cta-row .btn, .pb-cta-row .btn', hero) : [];
  const floaters = hero ? $$('.float-i, .pb-float', hero) : [];
  const blobs = hero ? $$('.blob', hero) : [];
  const heroMedia = hero ? $$('.pb-tub-shape', hero) : [];
  const marquee = $('.hero .mq') || $('.pb-mq');
  const navBar = $('nav .bar');
  const navLogo = $('nav .logo');
  const navItems = $$('nav ul li');
  const navCta = $('nav .btn.small');
  const navToggle = $('.nav-toggle');

  // Pre-state. Set synchronously so nothing flashes in its final position
  // before the timeline takes over.
  const h1Split = heroH1 ? splitHeading(heroH1) : null;
  const pSplit = heroP ? splitLines(heroP) : null;

  if (h1Split) gsap.set(heroH1, { perspective: 900 });
  if (h1Split) gsap.set(h1Split.chars, { yPercent: 120, rotateX: -80, opacity: 0 });
  if (pSplit) gsap.set(pSplit.lines, { yPercent: 110, opacity: 0 });
  gsap.set(eyebrow, { opacity: 0, y: 18, scale: 0.94 });
  gsap.set(buttons, { opacity: 0, y: 26, rotate: -3.5 });
  gsap.set(floaters, { opacity: 0, scale: 0.5, rotate: -18 });
  gsap.set(blobs, { opacity: 0, scale: 0.82 });
  gsap.set(heroMedia, { opacity: 0, scale: 0.86 });
  gsap.set(marquee, { opacity: 0, yPercent: 40 });
  gsap.set(navBar, { opacity: 0, y: -26 });
  gsap.set(navLogo, { opacity: 0, x: -14 });
  gsap.set(navItems, { opacity: 0, y: -12 });
  gsap.set([navCta, navToggle], { opacity: 0, scale: 0.86 });

  const tl = gsap.timeline({
    defaults: { ease: EASE.out },
    onComplete: () => {
      pre?.remove();
      // hand measurements back to ScrollTrigger now that the hero is settled
      ScrollTrigger.refresh();
    },
  });

  /* --- 1. logo reveal ---------------------------------------------------- */
  if (pre) {
    const mark = pre.querySelector('.mark');
    const churn = pre.querySelector('.churn');
    tl.from(mark, { scale: 0.6, opacity: 0, rotate: -40, duration: 0.85, ease: EASE.over }, 0)
      .from(churn, { opacity: 0, y: 14, duration: 0.5 }, 0.18)
      .to({}, { duration: MIN_HOLD }) // guaranteed presence
      /* --- 2. background morph: the cover sweeps off on its curved edge --- */
      .to(mark, { scale: 0.82, opacity: 0, duration: 0.4, ease: EASE.in }, '>-0.1')
      .to(churn, { opacity: 0, y: -10, duration: 0.35, ease: EASE.in }, '<')
      .to(
        pre,
        {
          yPercent: -118,
          duration: 1.15,
          ease: 'expo.inOut',
          onStart: () => gsap.set(pre, { pointerEvents: 'none' }),
        },
        '>-0.15'
      );
  }

  const revealAt = pre ? '-=0.72' : 0; // hero starts while the cover is still moving

  /* --- 3. headline ------------------------------------------------------- */
  tl.to(eyebrow, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, revealAt);

  if (h1Split) {
    tl.to(
      h1Split.chars,
      {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        duration: 1.15,
        stagger: { each: 0.018, from: 'start' },
      },
      '<+0.08'
    );
  }

  /* --- 4. decorative illustrations float into place ---------------------- */
  tl.to(
    blobs,
    { opacity: 1, scale: 1, duration: 1.4, ease: EASE.soft, stagger: 0.12 },
    '<+0.1'
  ).to(
    floaters,
    {
      opacity: 1,
      scale: 1,
      rotate: 0,
      duration: 1.1,
      ease: EASE.over,
      stagger: { each: 0.09, from: 'random' },
    },
    '<+0.15'
  );

  /* --- paragraph, line by line ------------------------------------------ */
  if (pSplit) {
    tl.to(pSplit.lines, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.08 }, '<+0.05');
  }

  /* --- 5. buttons slide in with a touch of rotation ---------------------- */
  tl.to(
    buttons,
    { opacity: 1, y: 0, rotate: 0, duration: 0.85, ease: EASE.over, stagger: 0.09 },
    '<+0.12'
  );

  /* --- 6. hero media scales in ------------------------------------------ */
  if (heroMedia.length) {
    tl.to(heroMedia, { opacity: 1, scale: 1, duration: 1.2, ease: EASE.soft }, '<-0.5');
  }

  /* --- marquee rides up from the fold ----------------------------------- */
  tl.to(marquee, { opacity: 1, yPercent: 0, duration: 1, ease: EASE.soft }, '<+0.1');

  /* --- 7. navigation ----------------------------------------------------- */
  tl.to(navBar, { opacity: 1, y: 0, duration: 0.9 }, '<-0.35')
    .to(navLogo, { opacity: 1, x: 0, duration: 0.7 }, '<+0.12')
    .to(navItems, { opacity: 1, y: 0, duration: 0.6, stagger: 0.055 }, '<+0.05')
    .to([navCta, navToggle], { opacity: 1, scale: 1, duration: 0.6, ease: EASE.over }, '<+0.08');

  /* --- 8. hand scrolling back ------------------------------------------- */
  // Released a beat before the timeline ends: by this point the hero is fully
  // legible, and waiting for the last nav tween would feel like a locked page.
  tl.call(() => lenis?.start(), null, '>-0.5');

  // Safety net — if anything above throws or a tween never resolves, the page
  // must never be left unscrollable behind a cover.
  gsap.delayedCall(6, () => {
    if (tl.progress() < 1) {
      tl.progress(1);
      pre?.remove();
      lenis?.start();
    }
  });

  return tl;
}
