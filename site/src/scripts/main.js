import Lenis from 'lenis';
import { animate, createTimeline, stagger, createSpring, createDrawable, utils } from 'animejs';

// Concept 7 · "Butter Playground" behaviour.
// Everything here is transform/opacity only and degrades cleanly:
//  - a choreographed hero intro (anime.js timeline, plays once after the
//    preloader sweeps) with an SVG line-draw on the hero shapes
//  - reveal-on-scroll (.rv -> .in), now a staggered anime cascade
//  - count-up statistics (anime-driven)
//  - a soft cursor blob that eases toward the pointer (rAF-batched)
//  - magnetic buttons (.magnetic) and flavour-card tilt (rAF-batched)
//  - the nav pill glide (anime.js spring)
// anime.js owns entrances/sequences/SVG and value-driven micro-interactions;
// the ambient idle loops (spin/bob/floaty/marquees) stay pure CSS. The blob +
// magnetic effects, plus all motion, are disabled under prefers-reduced-motion;
// content stays fully visible either way.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- hero intro: hidden entry-states -------------------------------------
// Line-draw proxies for the hero shapes, created at setup and animated in
// playHeroIntro() (createDrawable's return owns the animatable `draw` property).
let heroShapeDrawables = null;
// Set the hero's entry-states up front (opacity 0 / slight lift) so the intro
// timeline can play them in once the preloader cover sweeps away. This runs
// only when motion is allowed — under reduced motion (and with no JS) the hero
// simply renders in place, fully visible. The deferred module runs after first
// paint, but the full-screen preloader cover is already on top masking the
// hero, so applying these states here never flashes. See playHeroIntro().
if (!reduce) {
  utils.set('.hero .eyebrow, .hero p, .hero .cta-row', { opacity: 0, translateY: 18 });
  utils.set('.hero h1 .w', { opacity: 0, translateY: '0.5em' });
  utils.set('.hero .float-i', { opacity: 0 });
  // SVG shapes: stroke the outline (fill hidden), primed to draw in. The stroke
  // is applied here — not in CSS — so reduced-motion / no-JS render the plain
  // filled shapes exactly as before. createDrawable() returns proxy objects that
  // own the animatable `draw` property; we keep them to animate in playHeroIntro.
  if (document.querySelector('.hero-shape path')) {
    utils.set('.hero-shape path', { stroke: '#c3dbe7', strokeWidth: 2.5, fillOpacity: 0 });
    heroShapeDrawables = createDrawable('.hero-shape path');
    utils.set(heroShapeDrawables, { draw: '0 0' });
  }
}

// Plays the hero entrance once, called from the preloader's finish(). No-op
// under reduced motion (entry-states above were never applied, so the hero is
// already visible). Cleared inline transforms hand the floats/shapes back to
// their CSS spin/bob idle loops.
function playHeroIntro() {
  if (reduce) return;
  const tl = createTimeline({ defaults: { ease: 'out(3)', duration: 720 } });
  tl.add('.hero .eyebrow', { opacity: [0, 1], translateY: [18, 0] })
    .add(
      '.hero h1 .w',
      { opacity: [0, 1], translateY: ['0.5em', 0], duration: 820, delay: stagger(85) },
      '-=440'
    )
    .add('.hero p', { opacity: [0, 1], translateY: [18, 0] }, '-=480')
    .add('.hero .cta-row', { opacity: [0, 1], translateY: [18, 0] }, '-=560')
    .add(
      '.hero .float-i',
      {
        opacity: [0, 1],
        duration: 620,
        delay: stagger(90),
      },
      '-=560'
    );

  // SVG line-draw on the hero shapes, kicked off alongside the words: stroke the
  // outline on (animate the drawables), then fade the brand fill up on the paths
  // themselves. The shapes keep their CSS spin/bob idle throughout (that animates
  // the wrapper's transform, untouched here).
  if (heroShapeDrawables) {
    animate(heroShapeDrawables, { draw: ['0 0', '0 1'], duration: 1500, ease: 'inOut(2)' });
    animate('.hero-shape path', { fillOpacity: [0, 1], duration: 900, delay: 900, ease: 'out(2)' });
  }
}

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
  // `.no-depth` sections opt out: their content (SVG clip-path photos in
  // recipes, rounded overflow-hidden + box-shadow photos in made) can't be
  // GPU-composited, so animating the wrap's scale/opacity every scroll frame
  // re-rasterizes them on the main thread and stutters. Skipping the transform
  // there keeps scrolling smooth; the effect stays on every other section.
  const items = [...document.querySelectorAll('section:not(.no-depth) > .wrap')].map((el) => ({ el, top: 0, h: 0 }));
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

  // Sticky-cover parallax: the stockists shelf pins while the photo panel below
  // scrolls up over it (.stack-over in the CSS). CSS sticks it at top:0, which
  // is right when the shelf fits the viewport; when it's taller we bottom-pin it
  // (negative top) so its full content stays visible until the panel covers it.
  const shelf = document.querySelector('.stack-over > .shelf');
  if (shelf) {
    const pin = () => {
      shelf.style.top = Math.min(0, innerHeight - shelf.offsetHeight) + 'px';
    };
    pin();
    addEventListener('resize', pin);
    addEventListener('load', pin); // fonts/lazy images can grow the shelf
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
    // Kick the hero entrance a beat into the cover's upward sweep so the words
    // are already rising as the page is revealed (no-op under reduced motion).
    setTimeout(playHeroIntro, reduce ? 0 : 220);
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
    const MIN_MS = 500; // let the churn play at least this long
    const started = performance.now();
    const go = () => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started)));
    if (document.readyState === 'complete') go();
    else addEventListener('load', go, { once: true });
    setTimeout(finish, 6000); // absolute fallback so scroll never stays locked
  }
} else {
  // No preloader in the DOM — nothing will call finish(), so play the hero
  // intro directly rather than leaving its entry-states hidden.
  playHeroIntro();
}

// ---- reveal on scroll -------------------------------------------------------
// Each .rv fades and lifts into place as it enters. Siblings within the same
// container cascade (delay by DOM index, capped) so grid rows — the made-steps,
// the award badges — sweep in left-to-right instead of popping together. The
// entrance transform is cleared on complete so any CSS hover/idle transform on
// the element takes back over cleanly. Under reduced motion the elements are
// never hidden and just get the (inert) `.in` class.
const revealIn = (el) => {
  const parent = el.parentElement;
  const sibs = parent ? [...parent.querySelectorAll(':scope > .rv')] : [el];
  const i = Math.max(0, sibs.indexOf(el));
  animate(el, {
    opacity: [0, 1],
    translateY: [26, 0],
    duration: 720,
    ease: 'out(3)',
    delay: Math.min(i, 6) * 70,
    onComplete: () => {
      el.style.transform = '';
    },
  });
};

const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('in');
      if (!reduce) revealIn(e.target);
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
    if (!reduce) el.style.opacity = '0'; // hold hidden off-screen until revealed
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
      const state = { v: 0 };
      animate(state, {
        v: target,
        duration: 1200,
        ease: 'out(3)',
        onUpdate: () => {
          e.target.textContent = String(Math.round(state.v));
        },
      });
    }),
  { threshold: 0.6 }
);
document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

// ---- recipe "window" morph (hover) -----------------------------------------
// Each recipe photo is clipped into the quatrefoil brand shape via its OWN
// clip-path (#recipe-clip-i, driven by #rc-live-i). On hover that card's shape
// morphs into a rounded square and a recessed "window" frame fades in (depth,
// like looking through a pane); it eases back to the quatrefoil on pointer-leave.
// anime drives the scrubbable, reversible 0→1 progress (so a quick in/out
// reverses cleanly); we interpolate the sampled points ourselves because anime's
// morphTo collapses these particular paths. Hover-capable pointers only, and
// skipped under reduced motion — the photos then stay in their quatrefoil shape.
const recipeCards = [...document.querySelectorAll('.r-card')];
const rcSquare = document.querySelector('#rc-square');
if (recipeCards.length && rcSquare && !reduce && matchMedia('(hover: hover)').matches) {
  const N = 80;
  const samplePath = (el) => {
    const L = el.getTotalLength();
    return Array.from({ length: N }, (_, i) => {
      const p = el.getPointAtLength((L * i) / N);
      return [p.x, p.y];
    });
  };
  // Pair the two point sets so each quatrefoil point morphs to the *nearest*
  // square point — otherwise mismatched start points / winding make the shape
  // collapse through a twisted sliver mid-morph. Pick the winding + rotational
  // offset of `b` that minimises the total squared distance to `a`.
  const alignTo = (a, b) => {
    const rev = [...b].reverse();
    let best = null;
    for (const arr of [b, rev]) {
      for (let off = 0; off < N; off++) {
        let sum = 0;
        for (let i = 0; i < N; i++) {
          const q = arr[(i + off) % N];
          sum += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
        }
        if (!best || sum < best.sum) best = { sum, arr, off };
      }
    }
    return Array.from({ length: N }, (_, i) => best.arr[(i + best.off) % N]);
  };
  // All photos share the same quatrefoil→square point pairing (identical shapes);
  // sample it once, lazily, on the first hover (by then the clip <svg> is laid
  // out, so getPointAtLength is valid). Each card sets `d` on its own path.
  let quat = null;
  let square = null;
  const buildD = (t) => {
    let d = '';
    for (let i = 0; i < N; i++) {
      const x = quat[i][0] + (square[i][0] - quat[i][0]) * t;
      const y = quat[i][1] + (square[i][1] - quat[i][1]) * t;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(4) + ',' + y.toFixed(4);
    }
    return d + 'Z';
  };

  recipeCards.forEach((card, i) => {
    const live = document.getElementById(`rc-live-${i}`);
    if (!live) return;
    const state = { t: 0 };
    let tween = null;
    const morphTo = (target) => {
      if (!quat) {
        quat = samplePath(live);
        square = alignTo(quat, samplePath(rcSquare));
      }
      tween?.pause();
      tween = animate(state, {
        t: target,
        duration: target ? 520 : 460,
        ease: 'out(3)',
        onUpdate: () => {
          live.setAttribute('d', buildD(state.t));
          card.style.setProperty('--win', state.t.toFixed(3));
        },
      });
    };
    card.addEventListener('pointerenter', () => morphTo(1));
    card.addEventListener('pointerleave', () => morphTo(0));
  });
}

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
      // Cancel any frame still queued from the last pointermove — otherwise it
      // runs after this reset and re-applies the offset, leaving the button
      // stuck off-centre next to its non-magnetic neighbour.
      if (pending) {
        cancelAnimationFrame(pending);
        pending = null;
      }
      b.style.transform = '';
    });
  });

  // flavour-card 3D tilt + mouse-following glow. Same rAF-batched, transform-only
  // idiom as the magnetic buttons above: JS only writes CSS custom properties
  // (--rx/--ry rotation, --gx/--gy/--go glow), and global.css owns the actual
  // transform + glow gradient. That keeps the CSS hover "pop" (--sc) composing
  // cleanly with the tilt, and lets the transition on .flav ease the tilt back
  // on leave instead of snapping. Only fires on real pointers.
  document.querySelectorAll('.flav').forEach((card) => {
    let pending = null;
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1 across the card
      const py = (e.clientY - r.top) / r.height;
      if (!pending)
        pending = requestAnimationFrame(() => {
          // invert Y so tilting toward the cursor (top → rotateX+, matches the
          // reference), ±8deg range.
          card.style.setProperty('--ry', `${(px - 0.5) * 16}deg`);
          card.style.setProperty('--rx', `${(0.5 - py) * 16}deg`);
          card.style.setProperty('--gx', `${px * 100}%`);
          card.style.setProperty('--gy', `${py * 100}%`);
          card.style.setProperty('--go', '0.5');
          pending = null;
        });
    });
    card.addEventListener('pointerleave', () => {
      if (pending) {
        cancelAnimationFrame(pending);
        pending = null;
      }
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--go', '0');
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
// hover background. Position/width are driven by anime.js spring easing for
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
        animate(navPill, { opacity: 0, duration: instant || reduce ? 0 : 200, ease: 'out(2)' });
        pillShown = false;
      }
      return;
    }
    const { x, width } = rectFor(el);
    animate(
      navPill,
      instant || reduce
        ? { translateX: x, width, opacity: 1, duration: 0 }
        : { translateX: x, width, opacity: 1, ease: createSpring({ stiffness: 160, damping: 18 }) }
    );
    pillShown = true;
  };

  navLinks.forEach((a) => {
    a.addEventListener('pointerenter', () => movePillTo(a));
    a.addEventListener('focus', () => movePillTo(a));
    // Clicking navigates to the section — the pill shouldn't stay parked on
    // the clicked link afterwards, only reappear on a fresh hover/focus.
    a.addEventListener('click', () => {
      activeLink = null;
      movePillTo(null);
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

  // Close after choosing a destination. This MUST run before the anchor
  // handler registered further up (which calls lenis.scrollTo): while the menu
  // is open Lenis is stopped and scroll is locked, so a scrollTo issued first
  // would be discarded and the link would appear to do nothing. Listening on
  // the <ul> in the capture phase gets us in ahead of the <a>'s own listeners,
  // so scrolling is unlocked by the time the anchor handler fires.
  navLinksEl?.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('a')) setNav(false);
    },
    true
  );

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

// ---- "notify me" popup (coming-soon waitlist + newsletter) ----------------
// A centred overlay card. Email capture goes through Web3Forms (client-side
// POST, no backend). Follows the mobile-menu idiom: class toggle + Lenis scroll
// lock (native overflow:hidden alone won't hold — Lenis drives scrolling) +
// Escape / backdrop close, all reduced-motion aware. Auto-opens once ~7s after
// load, remembered via localStorage; also opened by any [data-notify-open].
const notify = document.getElementById('notify');
if (notify) {
  const panel = notify.querySelector('.notify-panel');
  const form = notify.querySelector('.notify-form');
  const emailInput = notify.querySelector('.notify-input');
  const msgEl = notify.querySelector('.notify-msg');
  const submitBtn = notify.querySelector('.notify-submit');
  const bodyEl = notify.querySelector('.notify-body');
  const successEl = notify.querySelector('.notify-success');
  const doneBtn = notify.querySelector('.notify-done');
  const honeypot = notify.querySelector('.notify-hp');

  // Set once the popup has AUTO-opened, so it auto-opens only once per visitor.
  // Deliberately NOT set when the visitor opens it themselves via a trigger —
  // manually previewing the popup shouldn't suppress the auto-open. (Renamed
  // from the old `:dismissed` key, which was set on every close and could get
  // stuck, so existing visitors get a clean slate.)
  const SEEN_KEY = 'babs:notify:autoshown';
  const SUB_KEY = 'babs:notify:subscribed';
  const AUTO_OPEN_DELAY = 6000;
  const KEY_PLACEHOLDER = 'YOUR_WEB3FORMS_ACCESS_KEY';
  // localStorage can throw (private mode / disabled) — never let that break the UI
  const store = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };

  // Hand off from the no-JS `hidden` attribute to the CSS class system, so
  // visibility is now driven by `.notify-visible` (invisible until opened).
  notify.removeAttribute('hidden');

  let open = false;
  let openedThisSession = false;
  let lastTrigger = null;

  // If they've already subscribed, opening the popup should land on the thank-you
  // view rather than the form.
  const showSubscribedView = () => {
    bodyEl.hidden = true;
    successEl.hidden = false;
  };
  if (store.get(SUB_KEY)) showSubscribedView();

  const openNotify = () => {
    if (open) return;
    open = true;
    openedThisSession = true;
    lastTrigger = document.activeElement;
    notify.classList.add('notify-visible');
    notify.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('notify-locked');
    lenis?.stop();
    if (!reduce) {
      utils.set(panel, { opacity: 0, scale: 0.92, translateY: 14 });
      animate(panel, {
        opacity: [0, 1],
        scale: [0.92, 1],
        translateY: [14, 0],
        ease: createSpring({ stiffness: 170, damping: 18 }),
        onComplete: () => {
          panel.style.transform = '';
        },
      });
    }
    // focus the first actionable control in the visible view. Deferred two
    // frames: `.notify` transitions from visibility:hidden, and the element
    // stays non-focusable until that visible state has actually painted — a
    // single rAF fires too early (focus() silently no-ops), so double-rAF.
    const target = successEl.hidden ? emailInput : doneBtn;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (target || panel).focus({ preventScroll: true }))
    );
  };

  const closeNotify = () => {
    if (!open) return;
    open = false;
    notify.classList.remove('notify-visible');
    notify.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('notify-locked');
    lenis?.start();
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
    lastTrigger = null;
  };

  // triggers
  document.querySelectorAll('[data-notify-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openNotify();
    });
  });

  // close: backdrop, close button, and the success "back to it" button all carry
  // [data-notify-close]; panel content does not, so clicking inside won't close.
  notify.addEventListener('click', (e) => {
    if (e.target.closest('[data-notify-close]')) closeNotify();
  });

  // Escape + a simple focus trap while open (keydown only fires here when focus
  // is within the popup, which it is once opened).
  notify.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNotify();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = [
      ...notify.querySelectorAll(
        'a[href], button:not([disabled]), input:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => el.offsetParent !== null); // drop hidden (display:none) controls
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // submit → Web3Forms
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (emailInput.value || '').trim();
    emailInput.classList.remove('is-invalid');
    msgEl.textContent = '';

    if (!email || !emailInput.checkValidity()) {
      emailInput.classList.add('is-invalid');
      msgEl.textContent = 'Please enter a valid email address.';
      emailInput.focus();
      return;
    }

    const accessKey = form.dataset.accessKey;
    if (!accessKey || accessKey === KEY_PLACEHOLDER) {
      // No real key yet — don't hit the API, just flag it (see NotifyModal.astro).
      console.warn(
        '[notify] Web3Forms access key not set. Set PUBLIC_WEB3FORMS_KEY to enable signups.'
      );
      msgEl.textContent = 'Signups aren’t connected yet — add your Web3Forms key.';
      return;
    }

    submitBtn.disabled = true;
    const label = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          email,
          subject: 'New Babs waitlist signup',
          from_name: 'Babs Butter site',
          botcheck: honeypot?.checked ? true : '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        store.set(SUB_KEY, '1');
        showSubscribedView();
        if (!reduce) {
          utils.set(successEl, { opacity: 0, translateY: 10 });
          animate(successEl, { opacity: [0, 1], translateY: [10, 0], duration: 420, ease: 'out(3)' });
        }
        doneBtn?.focus({ preventScroll: true });
      } else {
        throw new Error(data.message || 'Request failed');
      }
    } catch {
      msgEl.textContent = 'Something went wrong. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });

  // auto-open once after the page settles, unless it's already auto-shown to
  // this visitor or they've subscribed. Guarded by openedThisSession too, so if
  // they manually opened it before the timer fires we don't pop it a second time.
  const canAutoOpen = () => !store.get(SEEN_KEY) && !store.get(SUB_KEY);
  if (canAutoOpen()) {
    const startTimer = () =>
      setTimeout(() => {
        if (canAutoOpen() && !open && !openedThisSession) {
          store.set(SEEN_KEY, '1'); // consume the one-time auto-open
          openNotify();
        }
      }, AUTO_OPEN_DELAY);
    if (document.readyState === 'complete') startTimer();
    else addEventListener('load', startTimer, { once: true });
  }
}
