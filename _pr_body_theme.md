## Changes

- Fixed: Color theme now correctly applies to the entire UI (main background, header, sidebar, cards, buttons, badges) — previously only partially worked due to missing `bg-gray-950` CSS override and incorrect cascade specificity.
- Fixed: `applyThemeColors` now always sets all 6 CSS variables unconditionally (previously skipped falsy values).
- New: 4 built-in color presets — Default (Green), Ocean (Blue), Sunset (Orange), Violet — apply with one click and save automatically.
- Removed: Dark/Light mode toggle — the app is always dark-themed (colors fully controlled via Settings).
