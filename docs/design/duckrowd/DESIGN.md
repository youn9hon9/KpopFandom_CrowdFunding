---
name: Duckrowd
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3c4a3f'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6c7b6e'
  outline-variant: '#bbcbbc'
  surface-tint: '#006d3c'
  primary: '#006d3c'
  on-primary: '#ffffff'
  primary-container: '#00c471'
  on-primary-container: '#004a27'
  inverse-primary: '#40e18a'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#006d3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#37c275'
  on-tertiary-container: '#004a26'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#63fea4'
  primary-fixed-dim: '#40e18a'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#78fca8'
  tertiary-fixed-dim: '#59df8e'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#00522b'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Noto Sans KR
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Noto Sans KR
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Noto Sans KR
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Noto Sans KR
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  max_width: 1200px
  header_height: 64px
  container_padding: 24px
  gutter: 20px
  unit_xs: 4px
  unit_sm: 8px
  unit_md: 16px
  unit_lg: 24px
  unit_xl: 48px
---

## Brand & Style
The design system for this platform balances the energetic excitement of K-pop fandom with the rigorous security of a fintech application. The brand personality is "Transparently Enthusiastic"—it provides a clean, safe, and professional environment where fans can mobilize resources with total confidence.

The design style is **Corporate Modern with a Friendly Edge**. It utilizes high-quality white space, a systematic approach to information density, and subtle tactile cues. The interface avoids "fan-site" clutter in favor of a "fandom-utility" aesthetic, ensuring that the primary focus remains on project legitimacy, financial transparency, and community progress.

## Colors
The palette is anchored by a vibrant "Trust Green" (#00C471) which signifies both financial growth and positive momentum. This is complemented by a "Holding Orange" (#F97316) specifically reserved for escrow and pending states to indicate money in transition without the negativity of an error state.

The background remains a crisp white to maintain a high-contrast, clean environment. Surfaces use a soft gray (#F3F4F6) to create depth without relying on heavy shadows. Border colors are kept light (#E5E7EB) to define structure subtly. Semantic colors are used strictly for status-based feedback: amber for review/warning, light green for active funding, and red for failed projects or refunds.

## Typography
The system uses **Plus Jakarta Sans** for headlines to provide a modern, slightly rounded, and friendly tech feel. For all body copy and functional text, **Noto Sans KR** is employed to ensure maximum readability and professional rendering of Korean characters across all operating systems.

- **Headlines:** High weight (600-700) with tight letter spacing for a punchy, editorial feel.
- **Body:** Standardized at 16px for optimal legibility during long-form reading (e.g., project descriptions).
- **Labels:** Used for metadata, tags, and secondary navigation items, often utilizing medium or semi-bold weights to maintain hierarchy at smaller sizes.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop with a maximum content width of 1200px. This ensures that information-dense crowdfunding data remains readable and doesn't stretch excessively on ultra-wide monitors.

A 64px sticky header provides constant access to search and user profile actions. The spacing system is built on an 8px base unit. 
- **Desktop:** 12-column grid with 20px gutters.
- **Tablet:** 8-column grid with 16px gutters and side margins.
- **Mobile:** Single column with 16px safe-area margins.
Vertical rhythm is maintained through consistent use of the `unit_lg` (24px) for section spacing and `unit_md` (16px) for component internals.

## Elevation & Depth
Depth is communicated through **Tonal Layering** supplemented by **Ambient Shadows**. This approach maintains the "Clean & Safe" fintech image without appearing overly flat or clinical.

- **Level 0 (Background):** White (#FFFFFF) for the main canvas.
- **Level 1 (Surface):** Soft Gray (#F3F4F6) for secondary containers, sidebar areas, or grouped content sections.
- **Level 2 (Cards):** White surfaces with a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)). This elevation is used for Project Cards and Category Grid items.
- **Level 3 (Modals/Overlays):** White surfaces with a more pronounced shadow (0px 12px 32px rgba(0,0,0,0.12)) and a backdrop blur of 8px on the layer beneath to focus user attention.

## Shapes
The shape language is "Rounded-Professional." 
- **Standard UI (Cards, Inputs, Banners):** Use a 12px (md) radius to feel modern and accessible.
- **Small Elements (Chips, Checkboxes, Tooltips):** Use an 8px (sm) radius.
- **Interactive Action Elements:** Search bars and primary CTA buttons are **Pill-shaped (999px)**. This distinction separates "content containers" (square-ish) from "action triggers" (rounded), guiding the user intuitively toward interaction points.

## Components

- **Project Cards:** Feature a high-quality thumbnail, a clear "Trust Temperature" progress bar using the primary green (#00C471), and a metadata footer for funding dates and backer counts.
- **Trust Temperature Bar:** A custom progress component. The track is Surface Gray (#F3F4F6), and the fill is Primary Green. For projects in "Escrow" or "Review," the fill color shifts to the respective semantic color.
- **Buttons:** Primary buttons are pill-shaped with #00C471 background and white text. Secondary buttons use a #00C471 outline or a light green tint background.
- **Search Input:** A large, pill-shaped field with a subtle 1px border (#E5E7EB) that thickens and changes to primary green on focus.
- **Role Banners:** Full-width, low-height banners at the top of pages. 
    - *Admin:* Dark neutral background with white text.
    - *Host:* Light green tint (#E6F9F1) with dark green text.
    - *Backer:* Soft gray background with muted text.
- **Category Shortcut Grid:** Square cards (12px radius) containing a centered emoji and a label-md text. On hover, the card lifts slightly using Level 2 elevation.
- **Project Wizard:** A horizontal 3-step indicator at the top of the creation flow, using connected nodes. Completed steps are Primary Green, current step is outlined, and future steps are Muted Gray.
- **Social Login:** Brand-compliant buttons for Google and Kakao, keeping their original brand colors but conforming to the platform's pill-shaped button height and width for consistency.