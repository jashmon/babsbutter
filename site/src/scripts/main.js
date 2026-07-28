/* ===========================================================================
   ENTRY POINT
   Animation lives in ./anim/*; this file wires it together and keeps the
   non-animation behaviour (anchor routing, video playback) that shouldn't be
   entangled with motion.
   =========================================================================== */
import { gsap, ScrollTrigger, lenis, reduced, fontsReady, $$ } from './anim/core.js';
import { runLoader } from './anim/loader.js';
import { initText } from './anim/text.js';
import { initSections } from './anim/sections.js';
import { initCursor, initButtons, initCards, initCounters } from './anim/ui.js';
import { initNav } from './anim/nav.js';

/* ---- anchor routing ------------------------------------------------------
   In-page hashes glide via Lenis. Route-aware hrefs (`/#flavs` from a
   subpage) are left to the browser — they're a real navigation. */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -12, duration: 1.1 });
    else if (target !== 0) target.scrollIntoView();
    else scrollTo(0, 0);
  });
});

/* ---- video ---------------------------------------------------------------
   Decode only what's on screen, and restart loops manually — the native
   `loop` boundary shows a dark re-buffer flash on some setups. */
const vids = $$('video[autoplay]');
if (vids.length && 'IntersectionObserver' in window) {
  const vio = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.paused) v.play()?.catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      }),
    { threshold: 0.2, rootMargin: '200px 0px' }
  );
  vids.forEach((v) => vio.observe(v));
}
vids.forEach((v) =>
  v.addEventListener('ended', () => {
    v.currentTime = 0.01;
    v.play()?.catch(() => {});
  })
);

/* ---- boot ----------------------------------------------------------------
   SplitText must measure against the real webfonts, so text work waits on
   document.fonts. The nav and loader don't depend on glyph metrics and start
   immediately, so the page never looks inert while fonts resolve. */
initNav();

const boot = async () => {
  await fontsReady();

  // hero is claimed by the loader; everything else is scroll-driven
  const heroHeading = document.querySelector('.hero h1, .pb-hero h1');
  const heroCopy = document.querySelector('.hero p, .pb-hero-copy p');

  runLoader();
  initText(document, [heroHeading, heroCopy].filter(Boolean));
  initSections();
  initCounters();
  initCards();
  initButtons();
  initCursor();

  // final measurement pass once fonts + late media have settled
  ScrollTrigger.refresh();
};

boot();

addEventListener('load', () => ScrollTrigger.refresh());

/* Reduced motion: guarantee nothing is left mid-animation or hidden. */
if (reduced) {
  gsap.set('.rv, [data-anim]', { clearProps: 'all', opacity: 1 });
}
