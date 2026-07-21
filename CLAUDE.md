# Babs Butter — Project Reference

## What this repo is

An Astro app (`site/`) — the Babs Butter marketing site. This is where all ongoing/production work happens.

`site/` was originally scaffolded from a set of static client-review concept HTML files that lived at the repo root; those concepts have since been removed. A top-level `assets/` folder (brand fonts, logos, shapes, illustrations, photography, video) is still present at the repo root — it's byte-identical to `site/public/assets/` and is being left in place for now rather than deleted, but `site/public/assets/` is the copy that's actually served. Treat root `assets/` as inert; make asset changes in `site/public/assets/`.

This file exists so future sessions never need to re-open `Babs_Butter_Brand_Guide_Version1.pdf` (32 pages, ~52MB, v1, 1 Feb 2026, by Maddie Design) — everything load-bearing from it is captured below.

## Brand

### Objectives / positioning
- THE butter brand people aspire to buy.
- Fresh, modern, healthy — think strolling a European street and finding an organic grocer.
- Very sensory branding: visuals should evoke texture, aroma, taste, not just show product.
- Communicate health, freshness and luxury *alongside* indulgence, richness, fun — not a tension to resolve, a combination to hold at once.
- Push past category norms for butter branding; stand out on shelf and on screen.

### Target audience
20–65, premium grocery buyers, health-conscious individuals and families, households who eat butter regularly but want a cleaner, better-for-you option without giving up taste.

### Values
Healthier, cleaner, tastier butter. Traditional recipes upgraded with modern science. A wide product range for diverse dietary/health needs.

### Tone of voice
Warm & friendly · Modern · Reassuring · Confident · Liberal

### Photography direction
Macro imagery, sensory close-ups and textures — of the butter itself and of the recipes made with it. Not studio-flat product shots.

## Color palette

CSS vars live in `site/public/assets/fonts.css` — use those vars, don't hardcode hex.

**Primary**
| Token | Var | Hex |
|---|---|---|
| Dark Choc | `--dark-choc` | `#2F1D0F` |
| Babs Butter | `--butter` | `#F6E6A6` |
| Tangerine | `--tangerine` | `#E96224` |
| Flour | `--flour` | `#FCF7EB` |
| Butterfly Pea | `--butterfly-pea` | `#C3DBE7` |

**Secondary**
| Token | Var | Hex |
|---|---|---|
| Blueberry | `--blueberry` | `#262A62` |
| Plum | `--plum` | `#7A3754` |
| Biscuit | `--biscuit` | `#F8C67D` |
| Coffee Bean | `--coffee-bean` | `#744D2F` |
| Raspberry Coulis | `--raspberry` | `#8B231C` |
| Truffle | `--truffle` | `#DDDDD2` |
| Matcha | `--matcha` | `#3C431C` |

Packaging colour system: one consistent background/accent colour pairing across the range, with one distinct colour per flavour — see `site/src/components/FlavourCard.astro` + `site/src/data/flavours.ts` for a working example.

## Typography

Usage rules, not just font names:

- **Roketto** — display/headings only.
- **Miller Text Italic** — secondary text needing "modern elegance" (pull quotes, taglines).
- **Public Sans** — all body copy and any text-heavy block; the legibility font.
- **Antique Olive Nord** — the "Butter" wordmark font in the logo itself. Sparing accent use only, never body text.
- **Professor** — artisanal/premium accent. Sparing use only.

`@font-face` declarations for all five are in `site/public/assets/fonts.css`; family names match exactly (`'Roketto'`, `'Miller Text'`, `'Public Sans'`, `'Antique Olive Nord'`, `'Professor'`).

## Asset map (`site/public/assets/`)

- `logos/` — `primary-*`, `secondary-*`, `icon-*`, `lockup-*`, each in `butter` / `tangerine` / `flour` / `darkchoc` colorways. `icon-*` are the round brand mark (no wordmark) — best choice for small/spinning/favicon use. Pick the colorway with contrast against whatever it sits on.
- `shapes/` — `butter-curl`, `flower`, `quatrefoil`, `ribbed-circle`, `wave`. Abstract decorative elements for framing/floating background use.
- `illus/` — `butter-stick`, `croissant`, `hearts`, `butter-swirl`, `butter-knife`, `exclamation`, `bread-butter`, `handshake`, `vegan`, `butter-dish`. Small line icons for category labelling (e.g. marquee content, feature-grid icons).
- `img/` — photography (macro/lifestyle stills).
- `video/` — three `.mov` lifestyle/product clips, used as autoplay/muted/loop background video.

**Rule: only use assets already in this folder.** Don't introduce new imagery, icons, or stock photography — if a page needs something that doesn't exist yet, flag it rather than substituting outside assets. Every asset reference is root-absolute (`/assets/...`) since `public/` is always served from `/`.

## Site conventions

- `<script>document.documentElement.classList.add("js","loading")</script>` runs synchronously in `<head>` (in `site/src/layouts/BaseLayout.astro`, marked `is:inline` so Astro doesn't defer it as a module), before first paint. It's the progressive-enhancement gate: CSS that hides/animates content (e.g. the `.rv` scroll-reveal pattern) is always scoped under `.js …`, so a no-JS visitor gets fully visible, unstyled-but-usable content instead of stuck-at-`opacity:0` content. This must stay inline — an external file fetch would undermine the FOUC-prevention timing.
- `.rv` = "reveal": elements start `opacity:0;transform:translateY(32px) scale(.98)`, get `.in` added by a shared `IntersectionObserver` on scroll, animate to resting state. Reused everywhere; extend rather than reinvent.
- `prefers-reduced-motion: reduce` is respected throughout by *neutralizing animation while keeping content visible* (e.g. `animation:none`), not by hiding things — the one exception is genuinely blocking/decorative full-viewport elements (like the loading intro), which should be removed outright rather than left inert on screen.
- Colors are CSS custom properties from `fonts.css`, referenced via `var(--token)`, never hardcoded hex.
- [Lenis](https://github.com/darkroomengineering/lenis) is an npm dependency (`lenis@1.3.25`) imported directly in `site/src/scripts/main.js` (`import Lenis from 'lenis'`), driving: smooth scroll, a velocity-reactive marquee, scroll-linked hero parallax, a draggable/momentum recipes carousel, and eased anchor-link scrolling. No GSAP, no WebGL/canvas/shaders anywhere in this repo. Everything degrades cleanly to plain CSS/native scroll under `prefers-reduced-motion` or if Lenis is unavailable (checked via a plain `!reduce` guard, since a missing package is a build-time error, not a runtime maybe).

## The `site/` Astro project

Astro 7, static output. `site/` has its own nested `CLAUDE.md`/`AGENTS.md` (Astro's auto-generated dev-server/docs guidance for agents) — that file is generic Astro tooling info, complementary to this one, not a replacement.

Layout:
- `site/public/assets/` — brand fonts, logos, shapes, illustrations, photography, video (see "Asset map" above). Not symlinked, so `site/` stays self-contained/independently deployable.
- `site/src/layouts/BaseLayout.astro` — head boilerplate, the synchronous `.js`/`.loading` script, nav, the loader, the scroll-progress bar, and the `<slot />` for page content.
- `site/src/pages/index.astro` — the one real page (hero → footer).
- `site/src/components/{FlavourCard,WhyCard,RecipeCard}.astro` + `site/src/data/{flavours,why,recipes}.ts` — the three sections that repeat 3-4x, data-driven. Everything else (hero, marquee, about, video band, quality, testimonials, shelf, faq, cta, footer) stays inline in `index.astro` — no componentization was invented where the source had no repetition.
- `site/src/styles/global.css` — global stylesheet, imported in `BaseLayout.astro`'s frontmatter.
- `site/src/scripts/main.js` — see Lenis note above. A `import.meta.hot.dispose(...)` guard tears down both Lenis instances + the shared rAF loop cleanly if Vite HMR ever hot-replaces this module in dev.
- **Explicit deferred TODO**: `assets/img/*` (62MB) and `assets/video/*.mov` (67MB) are served as plain `public/` passthrough, not through Astro's `<Image>` optimization pipeline (that requires ESM-importing from `src/assets/`, and doesn't apply to video at all). Flagged via a `TODO(image-optimization)` comment at the top of `index.astro` — worth doing before real launch, not done yet.
- Dev server: `npm run dev` (or `astro dev --background` per `site/CLAUDE.md`), defaults to `http://localhost:4321/`.

## Future direction (not yet built)

### E-commerce: Shopify, including customer login
The site will need Shopify for checkout/inventory/payments, and users will need to log in (accounts, order history, etc.) once it goes live. Recommended approach: use Shopify **headlessly** rather than adopting a Liquid theme — pull product data via the Storefront API (GraphQL) at build time, use Shopify's Cart API client-side for the cart drawer, and redirect to Shopify's own hosted checkout for payment. For login specifically, use Shopify's own hosted Customer Account pages/API rather than building custom auth — this covers account creation, login, and order history without needing a heavier app framework just to handle sessions. This keeps PCI compliance, order management, and auth on Shopify while leaving the actual site's design and motion work fully custom. A full Shopify Online Store 2.0 (Liquid) theme is a lower-effort fallback if the team later prefers single-platform simplicity over custom animation/motion — worth reconsidering only if that tradeoff changes.

### Recommended stack for the "real" site
**Astro** (static-first, component/island architecture) deployed to **Netlify or Vercel**, over Next.js. Astro ships zero JS by default, which suits a mostly-static, animation-heavy marketing site. Next.js would make sense if the site were becoming a genuinely app-like experience with lots of client-side state beyond commerce — it isn't; Shopify's hosted checkout/accounts cover the app-like parts already. Astro can still embed a React/Vue island later for anything that does need real client interactivity (e.g. a cart drawer). Content that grows over time (recipes, blog-style posts) can start as Astro content collections (plain markdown, no CMS) and move to a headless CMS later only if non-technical editors need it.
