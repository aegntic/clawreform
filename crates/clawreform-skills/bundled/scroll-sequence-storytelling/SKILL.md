---
name: scroll-sequence-storytelling
description: "Build Apple-style scroll-triggered frame-sequence narratives for clawREFORM by turning section copy into Remotion scenes, rendering MP4s, extracting frames, and wiring them into the site canvas scrubber"
---
# Scroll Sequence Storytelling

Use this skill when a landing page section needs to be explained through pinned, scroll-scrubbed visuals instead of static cards.

## Default workflow

1. Treat the section copy as a storyboard, not a paragraph dump.
2. Author the step data in `remotion-demo/src/scroll-sequence-data.ts`.
3. Build the visual sequence in `remotion-demo/src/SiteScrollSequence.tsx`.
4. Render the sequence video and extract numbered frames with `npm run render:site-sequences` from `remotion-demo/`.
5. Wire the exported frame directory into `site/src/app/page.tsx` and `site/src/components/scroll-story.tsx`.
6. Scrub the frames on the homepage canvas with `site/src/components/scroll-sequence-canvas.tsx`.
7. Rebuild the exported site with `npm run build` from `site/`.

## Project conventions

- Keep the scrollytelling source-of-truth in Remotion. The site should consume generated assets, not duplicate animation logic.
- Sequences should read as physical system diagrams: matte dark field, metal panels, disciplined amber light, sparse copy.
- Render to `site/public/scroll-sequences/<slug>/`.
- Export a video and numbered frames together so the same source can power both web scrubbers and standalone demos.
- Delay frame loading until the section approaches the viewport; do not preload every frame at initial page load.

## Guardrails

- Keep compositions deterministic. Avoid runtime APIs or network fetches inside Remotion scenes.
- Prefer canvas-driven frame playback on the site over hundreds of DOM nodes.
- Use pinned `ScrollTrigger` sections with `scrub` and a normalized `progress` value.
- Keep frame counts tight. Add frames only when they materially improve legibility.

## Verification

- Confirm `site/public/scroll-sequences/<slug>/` contains the MP4, `frame-0001...`, and `manifest.json`.
- Run `npm run build` in `site/`.
- Preview the exported site and verify the section pins, scrubs smoothly, and never reveals the install command before waitlist success.
