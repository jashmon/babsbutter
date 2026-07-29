/* ===========================================================================
   TEXT
   Headings and body copy reveal by rising into place, line by line, from
   behind a mask. Deliberately NOT per-character: character stagger reads as a
   shimmer sweeping across the words, which fights the calm of the brand. One
   clean upward move per line, softly staggered, is the whole language.

   Two rules keep this from wrecking the page:
   1. Split AFTER fonts resolve — splitting on fallback metrics gives wrong
      line boxes that never re-flow.
   2. Every tween clears its transform on completion, so text ends at exactly
      its natural CSS position and can never be left stranded mid-animation.
   =========================================================================== */
import { gsap, SplitText, EASE, inView, reduced, $$ } from './core.js';

/** Split into lines, each clipped so the line rises out of its own mask. */
export function splitLines(el) {
  const split = new SplitText(el, { type: 'lines', linesClass: 'sp-line' });
  // room for descenders so the mask never shears a 'y' or 'g'
  gsap.set(split.lines, {
    overflow: 'hidden',
    paddingBottom: '0.14em',
    marginBottom: '-0.14em',
  });
  return split;
}

// kept as an alias so the loader can share one vocabulary with this module
export const splitHeading = splitLines;

/** The one reveal: rise from below, fade in, settle. */
export function linesTween(el, vars = {}) {
  const split = splitLines(el);
  return gsap.from(split.lines, {
    yPercent: 115,
    opacity: 0,
    duration: 0.95,
    ease: EASE.out,
    stagger: 0.09,
    ...vars,
  });
}

export function initText(scope = document, skip = []) {
  // Reduced motion: never split, never hide. The from() tweens set opacity:0
  // immediately and would leave text invisible until scrolled to — exactly
  // what the preference asks us to avoid.
  if (reduced) return;

  const skipSet = new Set(skip);

  // Footer copy is deliberately excluded — the footer reveals as layered
  // blocks (see sections.js) and animating its text as well made arriving at
  // the bottom of the page feel busy rather than settled.
  const targets = $$('h2, .anim-lines', scope).filter(
    (el) => !skipSet.has(el) && !el.closest('footer') && el.dataset.split !== 'done'
  );

  targets.forEach((el) => {
    el.dataset.split = 'done';
    const split = splitLines(el);
    gsap.from(split.lines, {
      yPercent: 115,
      opacity: 0,
      duration: 0.95,
      ease: EASE.out,
      stagger: 0.09,
      scrollTrigger: inView(el, { start: 'top 82%' }),
      // land on the authored position, leaving no inline transform behind
      onComplete: () => gsap.set(split.lines, { clearProps: 'transform,opacity' }),
    });
  });
}
