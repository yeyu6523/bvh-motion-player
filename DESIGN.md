---
name: BVH Motion Player
description: A calm, legible workbench for local BVH skeleton inspection and playback.
colors:
  teal: "#176c5e"
  teal-hover: "#105447"
  paper: "#fffef9"
  shell: "#f4f3ed"
  viewport-sage: "#edf0e7"
  ink: "#213e3a"
  muted: "#596d65"
  line: "#d6ddd5"
  control-hover: "#e9eee5"
  metadata-line: "#e8ece5"
  limb-right: "#b7542e"
  limb-center: "#3f596b"
  error-paper: "#fff0e8"
  error-border: "#bc593d"
  error-ink: "#853d25"
  drag-tint: "#dfebe1ee"
typography:
  title:
    fontFamily: "'Manrope Variable', 'Microsoft YaHei', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Manrope Variable', 'Microsoft YaHei', sans-serif"
    fontSize: "28px"
    fontWeight: 750
    letterSpacing: "-0.03em"
  filename:
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.5
  section-label:
    fontSize: "13px"
    fontWeight: 750
    letterSpacing: "0.015em"
  button-label:
    fontSize: "13px"
    fontWeight: 650
  body:
    fontFamily: "'Manrope Variable', 'Microsoft YaHei', sans-serif"
    fontSize: "12px"
  caption:
    fontSize: "11px"
  hint:
    fontSize: "10px"
rounded:
  keycap: "3px"
  status: "4px"
  field: "5px"
  button: "7px"
spacing:
  control-step: "4px"
  icon-padding: "7px"
  compact-gap: "8px"
  label-gap: "9px"
  small-gap: "12px"
  panel-inset: "24px"
  shell-inset: "28px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "10px 14px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.button}"
    padding: "10px 14px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "7px"
    width: "35px"
  select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "7px"
  status:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.status}"
    padding: "6px 10px"
  error-banner:
    backgroundColor: "{colors.error-paper}"
    textColor: "{colors.error-ink}"
    typography: "{typography.body}"
    padding: "13px"
---

# Design System: BVH Motion Player

## Overview

**Creative North Star: "The Motion Workbench"**

A restrained, code-led desktop instrument for inspecting motion. Warm paper panels frame a pale sage three-dimensional stage, while dark green ink keeps file information and transport controls legible. The visual character is practical and calm rather than promotional.

The implemented world uses a conventional application shell, compact labeled controls, native form affordances, and a single teal action color. The rendered skeleton is the content: thin articulated lines, softly lit joint markers, and a receding ground grid provide depth without decorative UI effects.

This is an extraction, not a redesign or concept-image direction. Descriptive language is inferred from the delegated brief and implementation because this documentation pass has no user-interview channel. Sources: src/style.css, index.html, src/viewer.js, and current desktop/compact captures in output/desktop/. PRODUCT.md supplies the classroom-demonstration and offline-tool context only.

**Key Characteristics:**
- Warm paper chrome and a sage three-dimensional stage.
- Manrope Variable with Microsoft YaHei for Chinese text.
- Teal actions and consistent anatomical color coding.
- Flat, bordered controls with visible keyboard focus.
- A desktop inspector, viewport, and lower transport rather than a card dashboard.

## Colors

The palette is warm, low-saturation application chrome with one action accent and task-specific anatomical colors. The frontmatter is the normative value map.

### Primary
- **Quiet teal** (teal): open-file and playback actions, checked controls, slider accent, focus, the brand mark, and left-side skeleton joints. Its deeper hover companion is teal-hover.

### Secondary
- **Copper** (limb-right): right-side joints and their legend dot, not a competing action color.
- **Slate-blue** (limb-center): central and other joint groups, as implemented by inherited anatomical classification.

### Neutral
- **Warm paper** (paper): header, inspector, transport, selects, and status label.
- **Pale sage** (viewport-sage): canvas clear color, viewport background, and distant scene fog.
- **Shell linen** (shell): root background.
- **Green ink** (ink) and **muted sage ink** (muted): primary text and secondary descriptions.
- **Soft rules** (line and metadata-line): shell/control boundaries and fine metadata separators.
- **Control hover** (control-hover): light neutral hover for non-primary actions.

Error paper, border, and ink form the existing warm error state. The translucent drag tint belongs to file-drop feedback. Axis annotations and the ground grid retain their existing renderer/CSS colors; no synthesized tonal ramps are normative.

**The Anatomy Rule.** Reserve teal, copper, and slate-blue skeleton colors for left-side, right-side, and central or otherwise inherited joint groups respectively; keep the visible legend aligned with the renderer.

## Typography

**Shared font:** Manrope Variable, then Microsoft YaHei, then sans-serif. There is no separate display or monospace family. Keycaps inherit the same family.

- **Application title:** strong BVH prefix (800), lighter product-name suffix (500), tight tracking; the exact desktop title role is in frontmatter. It reduces to (18px) at the small-screen breakpoint.
- **Empty-state headline:** the largest heading, using the headline role; it is an operational invitation rather than marketing typography.
- **Filename:** a bold, wrapping title using the filename role; long file names may break anywhere.
- **Section labels:** compact, bold headings using the section-label role, with a bottom margin of (15px).
- **Controls and labels:** button-label and body roles keep controls dense. Metadata values use weight (650).
- **Captions and hints:** caption and hint roles cover viewport guidance, privacy copy, shortcut hints, and the source description; source description line-height is (1.7). Keycaps reduce to (9px) in the shortcut row.

There is no mathematical type-scale ratio or explicit global body line-height in the source; do not invent one.

**The Stable Numbers Rule.** Use tabular numerals for changing metadata values and timeline captions so playback does not cause numeric jitter.

## Layout

The desktop shell has a fixed-height header (82px), a left inspector (264px), and a flexible workspace. The workspace is a two-row grid: a growing viewport with a minimum track size (250px), then an auto-sized transport. Main content targets viewport height minus the header and retains a minimum height (560px). The inspector scrolls independently; default padding is (28px 24px 16px), section gap (27px). Desktop header horizontal padding is (28px).

The viewport is a clipped, relative positioning area. Its canvas is absolutely positioned to fill the viewport without contributing an intrinsic grid height; workspace and inspector allow their minimum height to shrink to zero. Top and bottom annotations sit (24px) from the sides; status and view label share the top edge, interaction guidance and axis key share the bottom. The empty state is centered with a maximum content width (400px) and relative width (90%). The transport uses padding (21px 28px 15px): timing row, full-width timeline, then playback, loop, and speed controls. The speed selector is right-aligned.

At (1000px) and below, the inspector narrows to (225px); header padding becomes (20px), the header caption disappears, inspector spacing tightens, and secondary timing guidance is hidden. At (650px) and below, the header becomes (70px); the workspace comes first and the two-column inspector follows below it. The viewport row becomes (420px), the transport wraps controls, and speed gets its own right-aligned row. This is the implemented responsive fallback, not a second visual identity.

The source uses explicit measured gaps rather than a complete spacing scale. Reuse established local values, but do not claim every margin is a multiple of a universal base. Clipping in an older or undersized capture is not an intentional layout rule.

## Elevation & Depth

Application chrome has no shadows or gradients. Fine borders and differences between paper and sage separate planes. The viewport alone uses real three-dimensional perspective, hemisphere/directional lighting, softly lit spherical joint markers, a receding grid, and fog matching the stage tone. That scene lighting is not a card-elevation system.

Feedback overlays use explicit stacking: viewport annotations (2), empty state (3), error banner (5), and drag overlay (6). The drag overlay is inset (12px).

**The Flat Chrome Rule.** Separate application panels with fine rules and tonal surfaces, not UI shadows; leave three-dimensional lighting to the skeleton viewport.

## Shapes

Controls are modestly rounded rectangles: the frontmatter's button, field, status, and keycap radii are intentionally different. Main panels and viewport edges remain square. Fine solid borders are the normal separator (1px); the file-drop overlay uses a dashed border (2px). Small circular legend dots (7px) echo the renderer's joint markers without becoming decorative badges.

Icons are inline SVG with rounded strokes (1.7px), normally (20px) square. The header brand mark is (32px) on desktop and narrows on small screens. The play glyph is filled; the remaining transport and file icons are stroke-based.

## Components

### Buttons

Compact and direct. Normal buttons have minimum height (40px), inline icon/text alignment, gap (9px), and the button radius. Primary buttons use teal with paper text and a matching border; enabled hover deepens the teal. Secondary buttons are transparent with a soft border; demo and reset actions fill the inspector width. Text actions remove the border and use teal text. Icon-only transport buttons are transparent (35px wide, minimum height 35px) with padding (7px). The play button has minimum width (105px), reduced to (85px) on small screens.

Background transitions last (150ms). Keyboard focus uses a teal outline (3px) offset by (3px) on buttons, inputs, selects, and the viewport. Disabled buttons use opacity (0.4) and a not-allowed cursor. No active-state transformation is implemented.

### Selects, Checks, and Timeline

Selects use paper surfaces, fine borders, field radius, and padding (7px). Checkboxes and the frame timeline retain native form rendering with teal accent. Checkboxes are (15px) square and paired with written labels. The timeline fills its row, declares a height (5px), and is initially disabled until a clip exists. The speed selector has desktop minimum width (95px).

### Metadata and Legend

Metadata is a compact definition list with left labels, right values, a fine separator per row, vertical padding (7px), and tabular value numerals. The skeleton legend pairs small colored dots with written anatomical labels. It is neither navigation nor a selectable chip set.

### Viewport Feedback

The status label is a paper rectangle with a fine border and status radius. The centered empty state pairs a headline and concise explanation with open-file and demo actions. Errors use warm alert fill, a fine alert border, wrapping text, padding (13px), and line-height (1.6). Drag-over feedback is a large centered instruction on a translucent tint with a dashed teal outline. Status and errors retain the source's status/alert semantics.

### Keyboard Hints

Small outlined keycaps use inherited typography, current-color borders, keycap radius, padding (2px 4px), and opacity (0.7). They support rather than replace visible control labels.

## Do's and Don'ts

### Do:
- **Do** retain paper control surfaces, sage viewport tone, and dark green text.
- **Do** keep primary actions teal and give keyboard-operable controls a visible focus outline.
- **Do** pair skeleton color with the written left, right, and center legend.
- **Do** preserve compact labels, aligned metadata values, and tabular timing numerals.
- **Do** keep small-screen controls in normal flow and let the inspector scroll on desktop.

### Don't:
- **Don't** turn this working tool into a marketing page or add decorative concept imagery.
- **Don't** add floating card shadows, gradients, or translucent glass to the flat application chrome.
- **Don't** treat the screenshot's teal viewport outline as a permanent border; it is keyboard focus.
- **Don't** add unsupported components or treat incidental clipping, hover defects, or browser-native styling as new design rules.
