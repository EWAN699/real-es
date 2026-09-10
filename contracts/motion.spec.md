# Motion contract

Animation presets, and which section types may use them. Agent A implements these;
Agent B provides the `useScrollAnimation` hook that runs them. Neither changes this
file without reporting to the orchestrator first.

## Presets

| Preset | Behaviour | Notes |
| --- | --- | --- |
| `fade-up` | Opacity 0→1, translateY 24px→0, triggered when the element is 85% up the viewport. | The default. Cheap, works everywhere. |
| `pin-reveal` | Section pins to the viewport while its inner content advances through states, then releases. | At most **two** per page — pinning is the heaviest thing we do and stacking them makes the page feel stuck. |
| `parallax-slow` | Background media translates at ~0.7× scroll speed within its container. | Container needs `overflow: hidden` and a fixed aspect ratio, or it shifts layout. |
| `text-split` | Heading splits to lines (never characters) and staggers in, 40ms apart. | Lines only. Hebrew is cursive-joined in many faces and per-character splitting breaks glyph shaping. |
| `horizontal-scroll` | Vertical scroll drives a horizontal track. | Exactly **one** per page. Must expose a visible progress indicator and stay swipeable on touch. |
| `none` | No animation. | Legitimate choice — use it for dense text. |

## Which type may use which

| Section type | Allowed presets |
| --- | --- |
| `hero` | `pin-reveal`, `text-split`, `none` |
| `intro` | `fade-up`, `text-split`, `none` |
| `services` | `fade-up`, `horizontal-scroll`, `none` |
| `stats` | `fade-up`, `none` |
| `showcase` | `horizontal-scroll`, `pin-reveal`, `parallax-slow` |
| `coverage` | `fade-up`, `none` |
| `process` | `pin-reveal`, `fade-up`, `none` |
| `testimonials` | `fade-up`, `horizontal-scroll`, `none` |
| `faq` | `fade-up`, `none` |
| `cta` | `fade-up`, `parallax-slow`, `none` |
| `contact` | `fade-up`, `none` |

## Rules that are not negotiable

1. **Reduced motion.** Every preset has a path under `prefers-reduced-motion: reduce`
   where the section renders complete and readable: final opacity, no transform, no pin,
   no scroll hijack. Horizontal-scroll degrades to a normal swipeable overflow row.
   This is tested, not assumed.
2. **RTL.** Horizontal motion follows the writing direction. In RTL the horizontal-scroll
   track advances right-to-left. Use logical properties; never hard-code `left`/`right`.
3. **No layout shift.** Anything that animates reserves its space before it animates.
   Media has explicit dimensions or an `aspect-ratio` box.
4. **Touch.** Scroll choreography works with a finger. Nothing depends on hover, and
   nothing traps the scroll so a user cannot get past it.
5. **One ScrollTrigger owner.** Triggers are created through `useScrollAnimation` and
   killed on unmount. No component calls `ScrollTrigger.create` directly.
6. **Budget.** Lighthouse mobile performance ≥ 90 on the home page is the ceiling on
   ambition. If a preset costs the budget, the preset loses.
