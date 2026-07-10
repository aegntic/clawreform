# Design Brief: clawREFORM

## Project
- **Type:** Landing page / marketing site (single page)
- **Brand:** clawREFORM by aegntic.ai
- **Pitch:** clawREFORM is the open-source operating system for autonomous AI agents.
- **Sections:** Hero, Features, Extensions, Docs, How It Works

## Visual Direction
- **Mood:** Dark & cinematic with tactile material realism — grounded in physical engineering metaphors
- **Style Guide:** [Tactile UI Blueprint](file:///home/ae/Downloads/Tactile_UI_Blueprint.pdf) — the authoritative reference for all material, lighting, and spatial rules

### Theme System
- **Dark mode (default):** Dark + Metal + Amber
- **Light mode:** Light + Metal + Amber
- Toggle: tactile on/off switch with metal track and amber "on" indicator

### Color System

**Dark Mode:**
| Token | Hex | Role |
|-------|-----|------|
| Background (Canvas) | `#1A1A1A` | Matte void — powder-coated metal, 1-3% noise grain overlay |
| Surface | `#222222` | Elevated panels, card bases |
| Surface Highlight | `#2A2A2A` | Top-left bevel catches (The Cut) |
| Primary Text | `#F0F0F0` | Headlines, body text |
| Muted Text | `#888888` | Captions, secondary info |
| Accent (Burnt Amber) | `#F5A524` | CTAs, energy glows, active states |
| Accent Hot Core | `#FFF5E0` | Near-white center of glow effects |
| Accent Deep | `#C47A00` | Gradient falloff endpoint |
| Border Highlight | `rgba(255,255,255,0.06)` | Specular edge on top/left |
| Border Shadow | `rgba(0,0,0,0.3)` | Shadow edge on bottom/right |

**Light Mode:**
| Token | Hex | Role |
|-------|-----|------|
| Background (Canvas) | `#F0EDE8` | Warm matte surface, 1-3% noise grain |
| Surface | `#FFFFFF` | Elevated panels |
| Surface Highlight | `#FFFFFF` | Top-left specular |
| Primary Text | `#1A1A1A` | Headlines, body |
| Muted Text | `#666666` | Captions |
| Accent (Burnt Amber) | `#D4890A` | Slightly darker amber for light bg contrast |
| Border Highlight | `rgba(255,255,255,0.8)` | Specular edge |
| Border Shadow | `rgba(0,0,0,0.08)` | Shadow edge |

### Typography
- **Display/Headline:** `Manrope` — 700/800 weight, used for H1, hero text, section titles. Same font family as the existing dashboard for continuity.
- **Body:** `Manrope` — 400/500 weight, used for paragraphs, descriptions, UI text.
- **Caption/Mono:** `IBM Plex Mono` — 400/500 weight, used for code snippets, technical labels, version numbers, and the brand wordmark (`claw`REFORM). Same as existing dashboard.
- **Font loading:** Google Fonts CDN (preconnect + stylesheet), same pattern as existing `index_head.html`.

### Imagery Approach
- No stock photography. The visual anchors are the **tactile UI components themselves** — metallic panels, amber energy flows, debossed tracks.
- The "product" IS the interface. Feature illustrations should show stylized clawREFORM UI elements (agent cards, terminal output, skill badges) rendered in the tactile material language.
- Background texture: 1-3% SVG noise grain overlaid on the matte canvas — this is a **strict structural law** from the blueprint. Without it, glows render as artificial digital gradients.

## Content Strategy
- **Tone:** Technical & precise + professional & confident, with subtle sophisticated humor (Porkbun-style — approachable, relatable to humans, not robotic). Think "competent engineer who's also fun at parties."
- **Copy source:** AI-generated based on the pitch and section structure below
- **Voice rules:**
  - Explain technical concepts plainly — no jargon without context
  - Occasional dry humor in supporting copy, never in headlines
  - Headlines are clear and scannable; personality lives in the subtext
  - Avoid: "revolutionize," "leverage," "synergy," "unlock," "seamless"

### Section Breakdown

**1. Hero**
- Headline: (TBD — something like "The OS for Autonomous Agents" or similar — write 3 options)
- Supporting: One short sentence expanding the pitch
- CTA: Primary amber button ("Get Started" or "Star on GitHub")
- Visual anchor: Full-bleed hero with boot-up animation — noise grain materializes, metallic surfaces emerge, amber energy flows through

**2. Features**
- Headline: (TBD — "What You Get" or "Agent Infrastructure, Not Just a Framework")
- Layout: 3-4 features, each with icon + headline + one-sentence description
- Feature candidates: Agent Spawning & Lifecycle, Channel Adapters (Slack/Discord/etc.), Skill System, Persistent Memory, Budget & Metering, A2A Protocol
- Cards: Tactile raised panels with contact shadows, hover lifts with amber under-glow

**3. Extensions**
- Headline: (TBD — "Bring clawREFORM With You" or "Browser Companions")
- Purpose: Showcase the two Chrome extensions as tactile panels that flip to reveal details
- **DevScribe** (v0.1.0) — Development companion for the clawREFORM dashboard. Capture, annotate, and export from any dashboard view. Connects to `http://127.0.0.1:4332/*`.
- **clawPrompt** (v1.0.4) — Browser companion for swarm command prompts. One-click inject into ChatGPT, Claude, Grok, Gemini, and OpenRouter. Zero data collection. Works on any AI chat site.
- Layout: Two tactile panels side by side (stacked on mobile). Each panel is a raised metal surface with contact shadow. Hover lifts with amber under-glow. Click/tap flips the panel to reveal: description, supported platforms, install CTA ("Add to Chrome"), and version number in IBM Plex Mono.
- Visual assets: Use existing extension screenshots from `extensions/` (screenshot-1-main.png, screenshot-1-popup.png, screenshot-2-hover.png, screenshot-3-search.png) and store assets (store-1-main.png, etc.) as the panel imagery.

**4. Docs**
- Headline: (TBD — "Read the Docs" or "Built to Be Understood")
- Purpose: Point users to documentation — quickstart, config reference, API endpoints, architecture overview
- Layout: Tactile panel grid (3-4 items), each panel is a debossed track containing a doc category. Hover lifts with amber under-glow. Click links out to the relevant docs page or anchors within.
- Doc categories (candidates — check what actually exists):
  - **Quickstart** — Get running in 5 minutes (install, config, first agent)
  - **Configuration** — `config.toml` reference, all fields explained
  - **API Reference** — REST endpoints, request/response formats
  - **Architecture** — Crate dependency graph, KernelHandle trait, AppState bridge
  - **Skills** — Built-in skills, writing custom skills, skill.toml format
  - **Channels** — Slack, Discord, and custom channel adapters
- Style: Each category rendered as a small debossed panel with an IBM Plex Mono label, one-line description in Manrope, and a subtle arrow or amber accent line indicating it's a link. Minimal — just enough to orient the reader before they click through.

**5. How It Works**
- Headline: (TBD — "How It Works" or "From Zero to Agent in 30 Seconds")
- Visual: Agent loop diagram — Spawn → Configure → Run → Observe — with amber energy pulsing through the cycle
- Supporting: One sentence per step

## Interaction Design
- **Motion level:** Rich — parallax, sticky sections, complex animations, cinematic scroll
- **Motion library:** Framer Motion
- **Performance budget:** Must still hit < 2s on 3G — use `will-change`, `transform`/`opacity` only, lazy-load below-fold animations

### Key Motions

1. **Boot-up sequence hero (Signature moment):** On page load, the matte void canvas appears first with noise grain. Then metallic surfaces materialize from the void with a top-left light sweep. Amber energy traces through the UI like current flowing through a circuit. The brand name "clawREFORM" stamps in with a tactile press effect. Total duration: ~2s, respect `prefers-reduced-motion`.

2. **Scroll-linked section reveals:** Each section reveals with a "milling from the void" effect — elements appear as if being machined out of the dark canvas. Uses Framer Motion `useScroll` + `useTransform` for parallax depth.

3. **Tactile button press:** All buttons physically depress on click — `translateY(2px)` + shadow reduction + subtle scale. Feels like pressing a real physical button. Hover state lifts the button (shadow increases).

4. **Amber glow hover:** Interactive elements gain an amber under-glow on hover — `box-shadow: 0 0 20px rgba(245, 165, 36, 0.25)` animating from 0. Energy "heats up" the element.

5. **Card flips:** Feature cards can flip on interaction to reveal more detail on the back — 3D CSS transform with tactile front/back faces.

6. **Dark/light toggle:** Metal track toggle with amber indicator that slides between positions. Smooth 300ms transition. State persists in `localStorage`.

## Technical
- **Stack:** React 18 + Tailwind CSS 3 + Framer Motion 11
- **Delivery:** Single HTML file — all JS/CSS inlined. Use a build step (Vite) that outputs a single file with React/Tailwind/Framer Motion bundled.
- **Constraints:**
  - WCAG AA accessible
  - < 2s load on 3G (code-split animations, preload fonts, inline critical CSS)
  - Single HTML file output
  - Must visually belong to the clawREFORM product family (same fonts, brand treatment, amber accent) but at significantly higher quality than the current dashboard
- **Responsive:** Both equally — desktop and mobile get full design fidelity, no compromises

## Tactile UI Physics (from Blueprint — enforced during build)

### The Matte Void Protocol
- Background is NEVER a flat hex code. It simulates powder-coated metal.
- Apply 1-3% SVG noise grain overlay on `#1A1A1A` (dark) / `#F0EDE8` (light).
- The grain catches and diffuses ambient light spills from emissive components.

### The Universal Law of Illumination
- Single global light source: **top-left**.
- **The Cut (Highlight):** Surfaces facing top-left receive crisp white/grey specular highlights — `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)` (dark mode).
- **The Catch (Shadow):** Surfaces blocked from light generate deep charcoal gradients — `box-shadow: inset 0 -1px 0 rgba(0,0,0,0.3)`.
- **THE LAW:** Every individual material layer — no matter how deeply stacked — must independently catch the top-left global light.

### Z-Axis Depth
- **Distant Drop Shadow (Float/Elevation):** `box-shadow: 2px 20px 25px rgba(0,0,0,0.5)` — for active/hovering elements.
- **Contact Shadow (Mass/Grounding):** `box-shadow: 0 6px 10px rgba(0,0,0,0.4)` — anchors base elements with physical weight. No X offset.

### Debossed Architecture
- Recessed elements: heavy dark inner shadow on top/left (blocking the light).
- 1px outer highlight immediately below the track edge.
- Recessed floor matches the matte canvas texture (proves it's milled from the same block).
- Thin white/grey highlight on inner bottom/right wall.

### Energy Mechanics (Amber Glow)
- **Hot Core:** Concentrated, opaque, near-white (`#FFF5E0`) immediately under/inside the physical element.
- **Gradient Falloff:** Smooth diffusion from white-hot → deep burnt orange (`#C47A00`) → seamlessly fading into the charcoal void.
- **Texture Retention:** The glowing color must `mix-blend-mode: multiply` over the noise grain background — this proves light is hitting a physical surface, not just a flat sticker.

### Spatial Mechanics
- **Expanded Margins:** Significant empty space between elements — massive drop shadows and radiant light spills must NEVER overlap or muddy the layout.
- **Generous Internal Padding:** Thick metallic bevels and deep inner shadows demand wide internal borders. Text/icons must never sit close to physical edges.
- **Focal Isolation:** Primary active elements forcefully isolated in vast amounts of dark space to funnel the viewer's eye.

### Material Assembly Order (bottom to top)
1. **Foundation** — Dark, matte, non-reflective base
2. **Separation** — Heavy drop shadow (multiply) injected beneath each piece
3. **Surface** — Main physical material with directional texture (brushed steel horizontal lines)
4. **Energy** — Under-glow (screen mode) using accent color tucked beneath bottom edges

## Hard Rules (enforced during build)
- One composition per viewport — the hero reads as one poster, not a dashboard
- Brand first — "clawREFORM" is the loudest text on the page, not the headline
- No cards by default — use tactile panels only when the panel IS the interaction
- Full-bleed hero — edge-to-edge, constrain only the inner text column
- Real visual anchor in the first viewport — the tactile boot-up sequence IS the anchor
- One job per section — Hero (promise), Features (what), Extensions (ecosystem), Docs (orientation), How It Works (how)
- Copy scannable by headlines alone — every section understandable from its headline
- Motion serves hierarchy, not decoration — every animation reinforces spatial depth
- Noise grain is mandatory — never ship a flat background
- Specular continuity is absolute — every stacked layer gets its own top-left highlight
- Dark/light toggle must persist and respect `prefers-color-scheme`
- `prefers-reduced-motion` must disable all non-essential animations

## Litmus Checks (verify after build)
- [ ] Brand "clawREFORM" is unmistakable in the first screen
- [ ] Noise grain texture is visible on the background (zoom in to verify)
- [ ] Top-left specular highlights are present on every raised element
- [ ] Page understood by scanning headlines only
- [ ] Each section has exactly one job
- [ ] Amber glow multiplies over the grain (not a flat sticker)
- [ ] Buttons physically depress on click (translateY + shadow shift)
- [ ] Dark/light toggle works and persists
- [ ] Design still feels premium with all decorative shadows removed
- [ ] Load time < 2s on 3G simulation
- [ ] WCAG AA contrast ratios pass in both themes
- [ ] Mobile layout has no compromises vs desktop
- [ ] `prefers-reduced-motion` is respected

## Relationship to Existing Dashboard
The current dashboard (`crates/clawreform-api/static/`) uses:
- Alpine.js SPA
- Manrope + IBM Plex Mono (same fonts — keep these)
- Amber `#F5A524` accent (keep)
- Brand treatment: `<span class="brand-wordmark-claw">claw</span><span class="brand-wordmark-reform">REFORM</span>`

This landing page should feel like the **premium exterior** to that dashboard — same DNA, but with the full tactile material treatment the blueprint describes. When a user clicks "Open Dashboard" from the landing page, the transition should feel like walking through the front door of a machine shop.
