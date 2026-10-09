# Two scrollcraft sites: HOLLIN (A) and HADAL (B)

| | URL | Source |
|---|---|---|
| **A. Hollin** (editorial travel house) | http://localhost:4517 | `sites/a` |
| **B. Hadal** (cinematic deep-ocean institute) | http://localhost:4518 | `sites/b` |

## Run
```bash
npm install              # gsap, lenis, playwright-core, @fontsource/*
node tools/sync-vendor.mjs   # copies libs + fonts into each site (already done)
node tools/serve.mjs         # serves A on 4517 and B on 4518
node tools/qa.mjs            # functional QA (needs Microsoft Edge installed)
node tools/final-shots.mjs   # regenerates artifacts/*/desktop|mobile|responsive
```
Each site is plain HTML/CSS/JS and self-hosted (no CDN). Dependencies: **GSAP + ScrollTrigger** (scroll animation), **Lenis** (smooth scroll, one scroller only), fonts via Fontsource: Instrument Serif + Hanken Grotesk (A), Unbounded + Familjen Grotesk (B). Pinned scenes use CSS `position: sticky`, so there are no pin-spacers fighting the layout.

## Screenshots
`artifacts/website-a|b/desktop` (1440×900 scroll states), `/mobile` (390×844), `/responsive` (1280×800, 768×1024, 360×800), plus `artifacts/gallery-*.png` contact sheets and `reduced-motion-hero.png`.

## What was built
**A. Hollin**: hero of five depth layers with a wordmark sandwiched between hills; word-by-word statement fill; overlapping parallax image composition with clip reveals; pinned "day at Casa Alba" (sun arcs, sky colour, clock, copy swaps over 4 states); sticky stacking cards that recede; stay index with cursor-following preview and detail dialog; circular reveal interlude; contact form; hide-on-scroll header that flips over dark sections.
**B. Hadal**: scroll maps to depth in metres. Single `depth` value drives gauge, water colour, marine-snow speed, pressure/temperature/light readouts; title tears apart and dissolves; pinned five-zone sequence; mask opening onto a trench profile with a descending probe; horizontal expedition track; 3D camera fly-through of specimens (translateZ, pointer tilt); contrast section "return to light" with animated wave; drifting three-line typographic finale.

## QA actually run (Edge, Playwright, live pages)
`tools/qa.mjs`: **52/52 passed in Edge and 52/52 in WebKit** (anchors land on targets; dialog open/Esc/focus return; "Ask about this stay" prefill + scroll; form validation; mobile menus; pinned states appear in order; B depth increases monotonically and resets to 0 at top; horizontal track ends with last panel on screen; every specimen card reaches full opacity; reverse scroll restores hero; reduced-motion renders all content, no smooth scroll; zero console errors / failed requests; plus the pause toggle, below).
Viewport matrix 1440, 1280, 768, 390, 360: no horizontal overflow (document scrollWidth) and zero console/network errors; mobile, tablet and narrow renders reviewed by eye.

Defects found and fixed during QA: nav blend-mode colour shift and overlap (A); wordmark colliding with CTAs on narrow phones (A); stacked cards flashing black on mobile (GSAP `filter` from `none`); Lenis stopped after dialog so "Ask" didn't scroll (A); stale depth/zone state after fast jumps (B); heading colliding with the horizontal track (B); small/sparse specimen cards (B); clipped finale type and cropped title (B); trench labels clipped on portrait phones (B); clipped "Join the list" button at 360px (B); low-contrast interlude text over the sun (A).

## Accessibility audit (WCAG 2.1 AA), `node tools/a11y.mjs a|b`
Method: at 40 scroll positions per site (desktop 1440 and mobile 390) every visible text element is measured against the pixels actually rendered behind it (text hidden, screenshot sampled, worst 5% of the box), including `mix-blend-mode: difference` text and occluded elements. Plus a Tab-order sweep and structure checks.
**Fixed:** chalk text on a bright sky in A's pinned day scene (top/bottom scrims); A's interlude text vanishing mid-transition (now a constant difference blend); B's nav, gauge, zone readouts, hero copy and trench labels over bright rays (scrims, backed gauge and labels); small grey labels under 4.5:1; nav/footer/brand/input targets under 44px; weak (~3:1) focus indicator on B's email field (now a 3px ink ring); infinite animations under reduced motion (now `animation: none`, was 0.01ms looping); open mobile menu did not trap focus (page behind is now `inert`); anchor links did not move focus to their target.
**Result:** 0 failing text elements at desktop (both sites) and at mobile (A); one transient mobile hit on B is a label mid-fade. Every tab stop shows a focus style, none is off-screen or hidden, skip link works, all form fields are labelled, all images have alt text, landmarks and heading order are sound.
**Pause animations (WCAG 2.2.2):** a fixed, labelled "Pause animations" button (44px, `aria-pressed`, second tab stop, label contrast 12.8:1 on A and 16.0:1 on B) stops every looping animation: A's scroll hint; B's light rays, scroll hint, surface wave and the drifting marine-snow canvas. The choice is stored in `localStorage` (`hollin-motion` / `hadal-motion`) and applied by a head script before first paint. Scroll-driven motion is not paused because the user is directly controlling it. The button is hidden under `prefers-reduced-motion` because nothing loops there. Tested: loops run before, stop after (Space key), stay stopped across reload, resume on second press, B's snow canvas is byte-identical 0.9s apart while paused.
**Not covered:** no screen-reader run (NVDA/VoiceOver), no 200% zoom or text-spacing test, no automated axe/Lighthouse pass, and non-text contrast was checked only for focus rings. The fixed toggle can sit over text while scrolling; it is a deliberate floating control and does not hide keyboard focus (focus of other elements scrolls into view natively).

## Design critique pass (from the delivered screenshots)
Fixed: Hadal's depth gauge covered the mobile title (it now stays hidden until the dive starts, so the count begins with the descent); Hollin's contrast scrim greyed out the lit house in the pinned day scene (now left-weighted on desktop, full-width on narrow screens, re-audited at 1440/768/390); Hollin's white wordmark merged with the white house on mobile (now pale sage); specimen captions were ~11px (now 15-19px, cyan names, brighter card backing); index/form scale, a clumsy "0" fact (now "None"), thicker finale outline; the pause button overlapped copy and the scroll hint (bottom padding added). Remaining weak spots I would still change: Hollin's flat illustrations stand in for photography; Hadal's far-away specimen captions are inherently small during the fly-through; no human review of motion feel.

## Cross-browser (`BROWSER=webkit node tools/qa.mjs`, `BROWSER=webkit OUT=artifacts/cross-browser/webkit node tools/final-shots.mjs`)
- **WebKit (Playwright build 27.2, Windows):** 52/52 functional checks pass; screenshots in `artifacts/cross-browser/webkit/` and contact sheets `artifacts/cross-browser/webkit-*.png`. Layout, typography, pinned scenes, clip-path reveals and forms match Edge.
- **Fixed after cross-browser review:** specimen cards were translucent so far cards ghosted through near ones (now opaque backing); A's pinned day scene cropped to the empty centre of the wide SVG on phones, hiding the sun and house (now framed on the house, sun path re-mapped); added `-webkit-backdrop-filter` and `overflow` fallbacks for Safari 15-17; the toggle keyboard test now allows WebKit's default Tab order (it skips links).
- **Not verifiable here, WebKit:** this Windows WebKit build ignores CSS `perspective` (proved with a minimal page: Edge draws a trapezoid, WebKit a flat squash), so B's 3D specimen fly-through renders as flat fading cards there. Real Safari on macOS/iOS was not tested.
- **Firefox: not tested.** Playwright's Firefox (157 and 132 both tried) will not start on this machine: Windows reports `Dependent Assembly mozglue ... could not be found` (SideBySide event log). A `mozglue.manifest` workaround did not help and was reverted. `tools/qa.mjs` and `tools/final-shots.mjs` already accept `BROWSER=firefox`; run them on a machine where Firefox launches. By inspection only, nothing used is unsupported in current Firefox (`inert`, `dialog`, `overflow: clip`, `backdrop-filter`, `svh`, `clip-path: inset(... round)`, `-webkit-text-stroke`, `mix-blend-mode`), but that is not a test.

## Honest limitations
- **AIS (localhost:4516) was not running** (connection refused), so it was not inspected and nothing here is derived from it. Fora and the other reference sites were not visited.
- **No image generation was used** (no Key.ai or other verified generator available). All art is original procedural SVG illustration, not photography; "immersive photographic compositions" in the brief are interpreted as illustrated, grain-textured compositions.
- **No video recordings**: Playwright's recorder needs an ffmpeg download that wasn't installed. Motion was verified with scripted scroll + screenshots + state assertions, not by watching playback, so easing/feel is not independently reviewed.
- Tested in Edge (Chromium) only; Safari/Firefox untested. Touch behaviour was emulated, not tried on a device.
- Forms are client-side only (nothing is sent). Stays, prices and expeditions are fictional; depths and animal facts are real.
- No automated accessibility audit (axe/Lighthouse) was run; semantics, focus styles, skip link, `aria-expanded`, dialogs and reduced-motion handling were built in and spot-checked.
