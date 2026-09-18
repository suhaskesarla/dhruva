# Dhruva — Visual Design

**Decision (Sep 2026): "First Light, gently warmed."** See `mockups/FINAL-first-light-all-ages.html` — this is the reference. A–F are the alternatives that were compared and rejected; they stay here as the record of why.

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| base | `#F0EFEC` | `#171A1D` | screen background |
| surface | `#F8F7F5` | `#1F2327` | Now card, sheets, composer |
| ink | `#232A30` | `#E6E8E9` | text, primary button |
| slate | `#5F6970` | `#98A1A8` | secondary text (4.9:1 / 6.6:1) |
| slateBoost | `#4E5860` | `#B4BCC2` | secondary text when OS high-contrast is on (7.2:1) |
| mist | `#CDD0CF` | `#30363B` | hairlines only |
| point | `#A67722` | `#D4A64A` | the one gold point per screen — decorative, never carries meaning alone |
| pointSoft | `#EADFC4` | `#3A3122` | halo on the Quiet screen only |

## Type
- **Newsreader** (serif) only at 20px and above: the directive, section headings, the quiet headline, the focus task.
- **Source Sans 3** for everything else: chat messages, review prose, chips, labels.
- Base 17px, scales with the OS text setting up to 200%. Nothing is fixed-size.

## Rules
1. At most one gold point per screen. It marks the Now; the word "Now" beside it carries the meaning.
2. Primary button is ink-on-base, never gold, never coloured.
3. No ambient motion. The Now marker and the Quiet halo are still. State transitions ≤150ms; none under reduced-motion.
4. Theme follows the system. Light is the brand; dark is the same palette at night.
5. Tap targets ≥48dp. Bold-text OS setting must not collapse hierarchy (directive is weight 500, not 400).
6. No screen ever shows more than 3 items (product rule, also a layout rule).

## Screens covered in the mockup
Chat/Now · Weekly Review · Focus Block · Hospice sheet · Quiet state.
