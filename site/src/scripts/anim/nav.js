/* ===========================================================================
   NAVIGATION
   Replaces the Motion One pill with GSAP, and adds hide-on-scroll-down,
   a hamburger morph and a cascading mobile menu timeline.

   The scrolled/compact styling stays in CSS (one class toggle) — it's a
   state change across five properties and CSS does that well. GSAP owns the
   things CSS can't: the shared pill, the reversible menu timeline, and the
   directional hide/show.
   =========================================================================== */
import { gsap, ScrollTrigger, EASE, mm, MQ, lenis, reduced, $, $$ } from './core.js';

export function initNav() {
  const nav = $('nav');
  if (!nav) return;

  /* ---- compact-on-scroll (CSS class) + hide on scroll down --------------- */
  const bar = $('nav .bar');
  let hidden = false;

  ScrollTrigger.create({
    start: 12,
    end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('navbar--scrolled', self.scroll() > 12);

      if (reduced) return;
      // hide travelling down, reveal travelling up — but never while the
      // mobile menu is open, and never near the very top
      const down = self.direction === 1;
      const past = self.scroll() > 260;
      const shouldHide = down && past && !nav.classList.contains('nav-open');
      if (shouldHide !== hidden) {
        hidden = shouldHide;
        gsap.to(nav, {
          yPercent: hidden ? -170 : 0,
          duration: hidden ? 0.5 : 0.65,
          ease: hidden ? EASE.in : EASE.over,
          overwrite: true,
        });
      }
    },
  });

  /* ---- shared pill indicator (desktop) ---------------------------------- */
  mm.add('(min-width: 1025px)', () => {
    const ul = $('nav ul');
    const pill = $('.nav-pill');
    if (!ul || !pill) return;

    const links = $$('a', ul);
    let active = links.find((a) => a.getAttribute('aria-current') === 'page') || null;
    let shown = false;

    /* Measured from rects, not offsetLeft. The <a>'s offsetParent is its <li>,
       so a.offsetLeft is always 0 — every link reported the same position and
       the pill never moved. Rects are relative to the viewport, so the
       difference against the <ul> gives the true offset regardless of which
       ancestor happens to be positioned (and stays correct while the nav
       itself is transformed by hide-on-scroll). */
    const measure = (el) => {
      const u = ul.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - u.left, width: r.width };
    };

    const moveTo = (el, instant) => {
      if (!el) {
        if (shown) {
          gsap.to(pill, { opacity: 0, duration: instant ? 0 : 0.25, ease: EASE.out, overwrite: 'auto' });
          shown = false;
        }
        return;
      }

      const m = measure(el);
      const to = { x: m.x, width: m.width, opacity: 1 };

      if (instant || reduced) {
        gsap.set(pill, { ...to, scaleY: 1 });
      } else if (!shown) {
        // first appearance: place it and fade up, no flight across the bar
        gsap.set(pill, { x: m.x, width: m.width, opacity: 0, scaleY: 1 });
        gsap.to(pill, { opacity: 1, duration: 0.3, ease: EASE.out, overwrite: 'auto' });
      } else {
        gsap.to(pill, { ...to, duration: 0.5, ease: EASE.out, overwrite: 'auto' });
        // squash-and-settle as it travels
        gsap.fromTo(pill, { scaleY: 0.84 }, { scaleY: 1, duration: 0.55, ease: EASE.over });
      }
      shown = true;
    };

    if (active) moveTo(active, true);

    const onEnter = (e) => moveTo(e.currentTarget);
    const onFocus = (e) => moveTo(e.currentTarget);
    // Clicking navigates to the section — the pill should not stay parked on
    // the clicked link afterwards, only reappear on a fresh hover/focus.
    const onClick = () => {
      active = null;
      moveTo(null);
    };

    links.forEach((a) => {
      a.addEventListener('pointerenter', onEnter);
      a.addEventListener('focus', onFocus);
      a.addEventListener('click', onClick);
    });

    const onLeave = () => moveTo(active);
    const onFocusOut = (e) => {
      if (!ul.contains(e.relatedTarget)) moveTo(active);
    };
    ul.addEventListener('pointerleave', onLeave);
    ul.addEventListener('focusout', onFocusOut);

    const onResize = () => {
      if (shown) moveTo(active, true);
    };
    addEventListener('resize', onResize);

    return () => {
      links.forEach((a) => {
        a.removeEventListener('pointerenter', onEnter);
        a.removeEventListener('focus', onFocus);
        a.removeEventListener('click', onClick);
      });
      ul.removeEventListener('pointerleave', onLeave);
      ul.removeEventListener('focusout', onFocusOut);
      removeEventListener('resize', onResize);
      gsap.set(pill, { clearProps: 'all' });
    };
  });

  /* ---- logo ------------------------------------------------------------- */
  mm.add(MQ.pointer, () => {
    const logo = $('nav .logo');
    const icon = $('nav .logo-icon');
    if (!logo || !icon) return;
    /* Relative rotation, so every hover spins a fresh full turn. An absolute
       `rotate: 360` only animates the first time — after that the icon is
       already at 360 and the tween has nowhere to go. */
    const enter = () => gsap.to(icon, { rotate: '+=360', duration: 1.05, ease: EASE.out });
    logo.addEventListener('pointerenter', enter);
    return () => {
      logo.removeEventListener('pointerenter', enter);
      gsap.set(icon, { clearProps: 'rotate' });
    };
  });

  initMobileMenu(nav);
}

/* --------------------------------------------------------------------------
   MOBILE MENU
   A single reversible timeline drives the panel and the cascade. The
   hamburger morph stays in CSS (it's a pure class-driven state) so the two
   can't desync.
   -------------------------------------------------------------------------- */
function initMobileMenu(nav) {
  const toggle = $('#nav-toggle');
  const panel = $('#nav-links');
  if (!toggle || !panel) return;

  const items = $$('li', panel);
  let open = false;
  let tl = null;

  const build = () => {
    const t = gsap.timeline({ paused: true })
      .fromTo(
        panel,
        { yPercent: -6, scaleY: 0.9, opacity: 0 },
        { yPercent: 0, scaleY: 1, opacity: 1, duration: 0.42, ease: EASE.out, transformOrigin: 'top center' }
      )
      .fromTo(
        items,
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: EASE.out, stagger: 0.055 },
        0.08
      );
    return t;
  };

  const setOpen = (next) => {
    if (next === open) return;
    open = next;

    nav.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('nav-locked', open);

    if (open) lenis?.stop();
    else lenis?.start();

    if (reduced) return; // CSS handles visibility; skip the choreography

    if (!tl) tl = build();
    if (open) tl.play();
    else tl.reverse();
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  // Capture phase: must unlock scroll (and restart Lenis) *before* the anchor
  // handler runs, or its scrollTo is issued against a stopped instance and
  // silently discarded.
  panel.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('a')) setOpen(false);
    },
    true
  );

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });

  addEventListener('click', (e) => {
    if (open && !nav.contains(e.target)) setOpen(false);
  });

  addEventListener('resize', () => {
    if (open && matchMedia('(min-width: 1025px)').matches) setOpen(false);
  });
}
