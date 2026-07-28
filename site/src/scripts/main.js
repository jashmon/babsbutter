import Lenis from 'lenis';
import { animate } from 'motion';

// Concept 7 · "Butter Playground" behaviour.
// Everything here is transform/opacity only and degrades cleanly:
//  - reveal-on-scroll (.rv -> .in), with an in-viewport "no-anim" fast path
//  - count-up statistics
//  - a soft cursor blob that eases toward the pointer (rAF-batched)
//  - magnetic buttons (.magnetic)
// The blob + magnetic effects, plus all motion, are disabled under
// prefers-reduced-motion; content stays fully visible either way.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Lenis smooth scroll + scroll-linked depth -----------------------------
// Native scroll stays the fallback: under reduced motion we skip Lenis and the
// depth effect entirely, and CSS html{scroll-behavior:smooth} keeps anchor nav
// pleasant. With motion allowed, Lenis eases the wheel/scroll, and each
// section's inner content recedes (scale + fade + lift) as it passes above the
// viewport centre while incoming content rises forward into place — so outgoing
// sections fall back as new ones come to the front. The transform is applied to
// the inner `.wrap` only, leaving the full-bleed section bands/borders seamless.
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
  const raf = (t) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // In-page anchors glide via Lenis instead of the native hash jump. The ids
  // live on the <section>/<header> bands (never on the transformed .wrap), so
  // scrollTo targets stay accurate.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -12, duration: 1.1 });
    });
  });

  // Depth: per-frame scale/fade/lift keyed off each block's distance from the
  // viewport centre. Positions come from offsetTop/offsetHeight (layout metrics
  // unaffected by transforms), so measuring can't feed back into the transform.
  const items = [...document.querySelectorAll('section > .wrap')].map((el) => ({ el, top: 0, h: 0 }));
  if (items.length) {
    document.documentElement.classList.add('depth-on');
    const measure = () => {
      for (const it of items) {
        let node = it.el,
          y = 0;
        it.h = it.el.offsetHeight;
        while (node) {
          y += node.offsetTop;
          node = node.offsetParent;
        }
        it.top = y;
      }
    };
    const update = () => {
      const vc = innerHeight / 2,
        sc = window.scrollY;
      for (const it of items) {
        let n = (it.top - sc + it.h / 2 - vc) / innerHeight;
        n = n < -1 ? -1 : n > 1 ? 1 : n;
        const a0 = Math.abs(n),
          a = a0 * a0 * (3 - 2 * a0), // smoothstep so the centre band stays crisp
          s = it.el.style;
        s.setProperty('--ds', (1 - 0.12 * a).toFixed(4)); // scale → 0.88 at the edges
        s.setProperty('--do', (1 - 0.5 * a).toFixed(4)); // opacity → 0.5 at the edges
        s.setProperty('--dy', (n * 36).toFixed(2) + 'px'); // parallax lift, signed by side
      }
    };
    measure();
    update();
    lenis.on('scroll', update);
    addEventListener('resize', () => {
      measure();
      update();
    });
    // Late layout shifts (fonts, lazy images) move the anchors — remeasure once loaded.
    addEventListener('load', () => {
      measure();
      update();
    });
  }
}

// ---- preloader ("churning…") ------------------------------------------------
// Adds `loaded` to <html> so the CSS sweeps the cover up, then removes the node.
// Under reduced motion the blocking full-viewport cover is removed outright.
const preloader = document.getElementById('preloader');
if (preloader) {
  lenis?.stop(); // hold scroll under the cover while the churn plays
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    document.documentElement.classList.add('loaded');
    lenis?.start(); // hand scrolling back once the cover sweeps up
    if (reduce) {
      preloader.remove();
      return;
    }
    let removed = false;
    const remove = () => {
      if (!removed) {
        removed = true;
        preloader.remove();
      }
    };
    preloader.addEventListener(
      'transitionend',
      (e) => {
        if (e.propertyName === 'transform') remove();
      },
      { once: true }
    );
    setTimeout(remove, 1400); // safety net if transitionend never fires
  };

  if (reduce) {
    finish();
  } else {
    const MIN_MS = 1200; // let the churn play at least this long
    const started = performance.now();
    const go = () => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started)));
    if (document.readyState === 'complete') go();
    else addEventListener('load', go, { once: true });
    setTimeout(finish, 6000); // absolute fallback so scroll never stays locked
  }
}

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

// ---- pause videos when off-screen (perf) -----------------------------------
// Background videos are cheap once compressed, but decoding several at once
// while Lenis drives the scroll-depth effect is what makes scrolling feel
// heavy. Only play a video while it's actually on screen; pause the rest.
// rootMargin gives a buffer so Lenis's inertia settling right at the 0.2
// boundary doesn't repeatedly pause/resume the same video — each restart of
// decode was showing as a visible dark flash. The paused/playing guards avoid
// redundant play()/pause() calls when the state hasn't actually changed.
const vids = document.querySelectorAll('video[autoplay]');
if (vids.length && 'IntersectionObserver' in window) {
  const vio = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.paused) {
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      }),
    { threshold: 0.2, rootMargin: '200px 0px' }
  );
  vids.forEach((v) => vio.observe(v));
}

// ---- manual seamless loop -----------------------------------------------
// The native `loop` attribute was showing a brief dark flash at the restart
// point on some setups — the browser treats the loop boundary similarly to a
// fresh load and can momentarily re-buffer even for tiny, fully-preloaded
// files. Restarting manually on 'ended', a beat before frame 0, avoids that
// hand-off hitch entirely.
vids.forEach((v) => {
  v.addEventListener('ended', () => {
    v.currentTime = 0.01;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  });
});

// ---- nav pill indicator ------------------------------------------------
// A single shared pill glides between nav links (hover, keyboard focus, and
// the last-clicked "active" link) instead of each link getting its own
// hover background. Position/width are driven by Motion's spring easing for
// the premium settle-with-a-touch-of-overshoot feel; everything collapses to
// an instant, non-animated jump under prefers-reduced-motion.
const navUl = document.querySelector('nav ul');
const navPill = document.querySelector('.nav-pill');
if (navUl && navPill) {
  const navLinks = [...navUl.querySelectorAll('a')];
  let activeLink = null;
  let pillShown = false;

  const rectFor = (el) => ({ x: el.offsetLeft, width: el.offsetWidth });
  // the pill is a desktop pointer affordance; below 1025px the links stack
  // into the mobile panel where a horizontal indicator makes no sense
  const pillActive = () => matchMedia('(min-width: 1025px)').matches;

  const movePillTo = (el, instant) => {
    if (!pillActive()) return;
    if (!el) {
      if (pillShown) {
        animate(navPill, { opacity: 0 }, { duration: instant || reduce ? 0 : 0.2 });
        pillShown = false;
      }
      return;
    }
    const { x, width } = rectFor(el);
    animate(
      navPill,
      { x, width, opacity: 1 },
      instant || reduce ? { duration: 0 } : { type: 'spring', duration: 0.62, bounce: 0.08 }
    );
    pillShown = true;
  };

  navLinks.forEach((a) => {
    a.addEventListener('pointerenter', () => movePillTo(a));
    a.addEventListener('focus', () => movePillTo(a));
    a.addEventListener('click', () => {
      activeLink = a;
    });
  });

  navUl.addEventListener('pointerleave', () => movePillTo(activeLink));
  navUl.addEventListener('focusout', (e) => {
    if (!navUl.contains(e.relatedTarget)) movePillTo(activeLink);
  });

  // Link positions shift on resize (nav can reflow at narrower widths) —
  // snap the visible pill back into place without animating the jump.
  addEventListener('resize', () => {
    const current = navUl.matches(':hover') ? null : activeLink;
    if (pillShown) movePillTo(current, true);
  });
}

// ---- scroll-reactive navbar --------------------------------------------
// Toggles a single `.navbar--scrolled` class and lets CSS drive every
// transition (height, padding, blur, shadow, logo scale, wordmark fade).
// Reads are rAF-batched and the class is only touched when the state
// actually flips, so scrolling never thrashes layout.
const navEl = document.querySelector('nav');
if (navEl) {
  const SCROLL_TRIGGER = 12;
  let navScrolled = null;
  let navTicking = false;

  const syncNav = () => {
    navTicking = false;
    const next = window.scrollY > SCROLL_TRIGGER;
    if (next === navScrolled) return;
    navScrolled = next;
    navEl.classList.toggle('navbar--scrolled', next);
  };

  const onNavScroll = () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(syncNav);
  };

  syncNav();
  addEventListener('scroll', onNavScroll, { passive: true });
}

// ---- mobile menu --------------------------------------------------------
// The bar keeps its desktop markup; below 1025px the same <ul> becomes a
// glass dropdown panel (see global.css) and this toggles `.nav-open` on the
// <nav>. Scroll is locked while open — both natively and via Lenis, which
// drives scrolling when motion is allowed.
const navToggle = document.getElementById('nav-toggle');
if (navEl && navToggle) {
  const navLinksEl = document.getElementById('nav-links');
  const isMobileNav = () => matchMedia('(max-width: 1024px)').matches;
  let navOpen = false;

  const setNav = (open) => {
    if (open === navOpen) return;
    navOpen = open;
    navEl.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('nav-locked', open);
    if (open) lenis?.stop();
    else lenis?.start();
  };

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setNav(!navOpen);
  });

  // close after choosing a destination (the anchor scroll still runs)
  navLinksEl?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setNav(false)));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOpen) {
      setNav(false);
      navToggle.focus();
    }
  });

  // tap anywhere outside the bar dismisses the panel
  addEventListener('click', (e) => {
    if (navOpen && !navEl.contains(e.target)) setNav(false);
  });

  // never leave the panel open (or scroll locked) when returning to desktop
  addEventListener('resize', () => {
    if (navOpen && !isMobileNav()) setNav(false);
  });
}
