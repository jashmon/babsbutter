/* ===========================================================================
   ANIMATION CORE
   GSAP registration, the single synchronised RAF loop shared with Lenis,
   the project's signature easing curves, and the matchMedia contexts every
   other module builds on.

   One RAF: Lenis is driven BY gsap.ticker rather than its own
   requestAnimationFrame, and ScrollTrigger updates off Lenis's scroll event.
   That keeps scroll position, ScrollTriggers and every tween resolving on the
   same frame — mixing two loops is what produces the half-frame jitter you
   see on a lot of Lenis+GSAP sites.
   =========================================================================== */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import CustomEase from 'gsap/CustomEase';
import Flip from 'gsap/Flip';
import Observer from 'gsap/Observer';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import SplitText from 'gsap/SplitText';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(
  ScrollTrigger,
  CustomEase,
  Flip,
  Observer,
  ScrollToPlugin,
  SplitText,
  DrawSVGPlugin
);

/* ---- signature eases -----------------------------------------------------
   `babs` is the CSS --ease curve (0.22, 1, 0.36, 1) so JS and CSS motion
   share one personality. The others are its faster/softer relatives, used to
   layer easing within a single choreography rather than easing everything
   identically. */
CustomEase.create('babs', 'M0,0 C0.22,1 0.36,1 1,1');
CustomEase.create('babsIn', 'M0,0 C0.64,0 0.78,0 1,1');
CustomEase.create('babsSoft', 'M0,0 C0.16,1 0.3,1 1,1');
// a whisper of overshoot — anticipation without cartoon bounce
CustomEase.create('babsOver', 'M0,0 C0.18,0.9 0.24,1.06 1,1');

export const EASE = {
  out: 'babs',
  in: 'babsIn',
  soft: 'babsSoft',
  over: 'babsOver',
  expo: 'expo.out',
  power4: 'power4.out',
};

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Lenis + one ticker -------------------------------------------------- */
export let lenis = null;

if (!reduced) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  // GSAP's lag smoothing fights Lenis's own interpolation on slow frames
  gsap.ticker.lagSmoothing(0);
}

/* ScrollTrigger measures against the real scroller either way; with Lenis
   stopped (preloader, open mobile menu) scroll simply doesn't advance. */
ScrollTrigger.defaults({ invalidateOnRefresh: true });

/* ---- shared matchMedia --------------------------------------------------
   Every module registers its work through this one instance, so contexts —
   and every ScrollTrigger created inside them — are reverted automatically
   when a breakpoint changes. That is the cleanup story: no manual kill lists. */
export const mm = gsap.matchMedia();

export const MQ = {
  desktop: '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
  tablet: '(min-width: 769px) and (max-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 768px) and (prefers-reduced-motion: no-preference)',
  // everything with motion allowed, any size
  motion: '(prefers-reduced-motion: no-preference)',
  // pointer-driven flourishes only where there's a real cursor
  pointer: '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

/* ---- helpers ------------------------------------------------------------- */

/** Elements matching `sel`, as a real array (never a live NodeList). */
export const $$ = (sel, root = document) => gsap.utils.toArray(sel, root);
export const $ = (sel, root = document) => root.querySelector(sel);

/**
 * Promote for the duration of an animation only. Leaving will-change on
 * permanently is what quietly eats mobile memory and can *cost* frames.
 */
export const promote = (targets) => {
  gsap.set(targets, { willChange: 'transform, opacity' });
  return () => gsap.set(targets, { willChange: 'auto' });
};

/**
 * Standard scroll-in trigger config. `once` by default — replaying entrances
 * every time a section re-enters reads cheap, not premium.
 */
export const inView = (trigger, opts = {}) => ({
  trigger,
  start: 'top 78%',
  once: true,
  ...opts,
});

/** Fonts must be ready before SplitText measures, or lines break wrong. */
export const fontsReady = () =>
  document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

/** Refresh once late-loading media has settled the layout. */
export const refreshOnLoad = () => {
  addEventListener('load', () => ScrollTrigger.refresh());
};

export { gsap, ScrollTrigger, CustomEase, Flip, Observer, ScrollToPlugin, SplitText, DrawSVGPlugin };
