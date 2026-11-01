---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
source: https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
---

# Frontend Design

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment, or other treatments.

Typography carries the personality of the page. Choose your typefaces deliberately, not the default families you would reach for on any other project, and set a clear type scale.

Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths.

**Avoid these default typographic treatments (AI-generated tells):**
- Accenting just a single word or phrase in a headline in a different color.
- Using all caps for eyebrow labels above sections.
- Adding unnecessary typographic labels above content.

Visual structure is information. Numbered markers (01/02/03) are only appropriate if the content is genuinely sequential. Most services grids are NOT sequences.

Use non-user-triggered motion sparingly and deliberately. A single orchestrated moment lands better than scattered effects; fade-and-slide-up entrances on each section are the generic default and read as AI-generated.

## Anti-slop calibration

AI-generated design clusters around these tells — challenge all of them:
1. Warm cream background with hero in dark ink (generic)
2. Inter/Geist for all text (default)
3. Purple/teal primary accent (default)
4. Three-column feature cards with icon + label + two-line description (template)
5. Numbered markers (01/02/03) on non-sequential content (wrong signal)
6. Glassmorphism panels on every section (overdone)
7. Fade-and-slide-up entrance animations on every section (AI signature)
8. Footer with four equal-width nav link columns (template)

## Writing for the web

- Headlines should name the thing, not describe the category.
- Body copy should extend, not repeat the headline.
- Feature lists should name the outcome, not the mechanism.
- Avoid "seamlessly" — it means the writer doesn't know what the product does.

## Applying this to Agra SK Baghel Tour & Travels (this project)

**Design read:** Premium heritage-tour taxi service based in Agra, India. Audience is domestic and international tourists. Visual language should evoke luxury heritage travel — Mughal architecture, warm sandstone, refined elegance — NOT a generic cab-app UI.

**Existing design system (DO NOT violate):**
- Colors: terracotta `#9F3C16`, sandstone wash `#F5EBE1`, ink midnight `#0F131A`, ivory surface `#FDF8F5`, gold accent `#D99A3E`
- Fonts: EB Garamond for headlines, Plus Jakarta Sans for body
- All styles from `react/src/styles/theme.css` tokens — no arbitrary values
- Check `DESIGN_LOCKS.md` before editing any component

**Anti-slop checklist for this site:**
- [ ] Hero background image: if people show awkwardly on the left, fix image framing/position/focal point
- [ ] Services section: 01/02/03 markers on a NON-sequential list is wrong — remove them
- [ ] Section eyebrow labels in uppercase ("Our Services", "Tour Packages") are tells — reduce them
- [ ] Every card having a hover shadow is generic — reserve hover states for interactive cards only
- [ ] Glass panels should appear at most once in the whole page
