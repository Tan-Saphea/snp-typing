---
name: neo_brutalism_styling
description: "Instructions and style rules for styling components in the SNP Typing application using the Neo-Brutalist / Playful Hard-Shadow design language."
---

# Neo-Brutalist Styling Skill

This skill defines the guidelines, components, and CSS/Tailwind classes for styling screens, boxes, buttons, badges, and fields in the SNP Typing application matching the playful Neo-Brutalist (hard shadow, bold outline) aesthetic.

## Custom CSS Classes

The application has predefined classes in `client/src/styles/index.css` for this styling system:

### 1. Cards
* `.snp-brutal-card`: The main brand-colored (emerald green) card with `8px` rounded corners and an offset hard shadow. Suitable for curriculum banners, highlights, and main content widgets.
* `.snp-brutal-card-slate`: Neutral grey slate variant. Ideal for document preview borders, text editors, logs, or secondary containers.

### 2. Buttons
* `.snp-brutal-button`: Full-width or large CTA buttons (e.g. "Complete Task"). Translates down on active state.
* `.snp-brutal-button-sm`: Smaller inline buttons (e.g. "Open" lesson). Translates down on active state.

### 3. Keys & Interactive Badges
* `.snp-brutal-key`: Applied to custom keycaps or small badge-like elements that behave like tactile keyboard buttons.

## Tailwind Utility Counterparts

If styling new templates or elements inline, use these configurations:
* **Borders**: E.g., `border-[1px] border-[#059669]` or `border-[2px] border-[#065f46]`.
* **Radius**: E.g., `rounded-[8px]` or `rounded-[6px]`.
* **Hard Shadow**: Add a shadow with offset and `0px` blur. E.g., `shadow-[0_6px_0_0_#059669]` or `shadow-[0_4px_0_0_#065f46]`.
* **Tactile Click Behavior**: Push the button down in active states by applying `hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-none transition-all duration-100`.

## 4. Typography
The entire application uses **Google Sans** as the official primary font family:
```css
font-family: "Google Sans", "Product Sans", "Plus Jakarta Sans", "Khmer OS Battambang", "Segoe UI", sans-serif;
```
All new components, headings, and interfaces must consistently maintain this font stack.
