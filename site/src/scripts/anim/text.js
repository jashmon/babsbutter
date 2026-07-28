/* ===========================================================================
   TEXT
   SplitText-based reveals. Headings animate per-character or per-word with a
   rotateX tilt; body copy reveals line by line behind a mask.

   Two rules keep this from wrecking the page:
   1. Split AFTER fonts resolve — splitting on fallback metrics gives wrong
      line boxes that never re-flow.
   2. Always revert() the split on cleanup, so the DOM (and screen readers /
      text selection) get the original nodes back.
   =========================================================================== */
import { gsap, SplitText, EASE, inView, reduced, $$ } from './core.js';

/** Split a heading into lines>chars, each line clipped so chars rise out of it. */
export function splitHeading(el) {
  const split = new SplitText(el, {
    type: 'lines,chars',
    linesClass: 'sp-line',
    // aria-label on the element keeps the original string for assistive tech
    autoSplit: true,
  });
  gsap.set(split.lines, { overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' });
  return split;
}

/** Split a paragraph into masked lines. */
export function splitLines(el) {
  const split = new SplitText(el, { type: 'lines', linesClass: 'sp-line' });
  gsap.set(split.lines, { overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' });
  return split;
}

/**
 * Build the char-reveal tween for a heading without playing it — the caller
 * decides whether it runs on scroll or inside the load timeline.
 */
export function headingTween(el, vars = {}) {
  const split = splitHeading(el);
  return gsap.from(split.chars, {
    yPercent: 118,
    rotateX: -78,
    opacity: 0,
    transformOrigin: '50% 100% -30px',
    duration: 1.05,
    ease: EASE.out,
    stagger: { each: 0.016, from: 'start' },
    ...vars,
  });
}

export function linesTween(el, vars = {}) {
  const split = splitLines(el);
  return gsap.from(split.lines, {
    yPercent: 110,
    opacity: 0,
    duration: 0.9,
    ease: EASE.out,
    stagger: 0.075,
    ...vars,
  });
}

/**
 * Wire every heading/paragraph on the page to its own scroll trigger.
 * `skip` lets the loader claim the hero so it isn't animated twice.
 */
export function initText(scope = document, skip = []) {
  // Reduced motion: never split, never hide. Splitting alone is harmless, but
  // the from() tweens set opacity:0 immediately and would leave headings
  // invisible until scrolled to — the exact thing the preference asks us to
  // avoid. Text simply renders as authored.
  if (reduced) return;

  const skipSet = new Set(skip);
  const perspective = (el) => gsap.set(el, { perspective: 800 });

  $$('h2, h3.anim-h, .pb-hero h1', scope).forEach((el) => {
    if (skipSet.has(el) || el.dataset.split === 'done') return;
    el.dataset.split = 'done';
    perspective(el);
    ScrollTriggerHeading(el);
  });

  $$('.anim-lines', scope).forEach((el) => {
    if (skipSet.has(el) || el.dataset.split === 'done') return;
    el.dataset.split = 'done';
    gsap.from(splitLines(el).lines, {
      yPercent: 110,
      opacity: 0,
      duration: 0.85,
      ease: EASE.out,
      stagger: 0.07,
      scrollTrigger: inView(el, { start: 'top 84%' }),
    });
  });
}

function ScrollTriggerHeading(el) {
  const split = splitHeading(el);
  gsap.from(split.chars, {
    yPercent: 118,
    rotateX: -78,
    opacity: 0,
    transformOrigin: '50% 100% -30px',
    duration: 1,
    ease: EASE.out,
    stagger: { each: 0.015 },
    scrollTrigger: inView(el),
  });
}
