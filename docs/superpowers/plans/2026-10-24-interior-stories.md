# TERRA interior stories implementation plan

Goal: replace only the inspiration mosaic with three full-width photographs beside a stationary room navigation.
Architecture: static HTML/CSS, existing ES modules, two animated neighboring layers, an independently tested six-second clock; no dependencies. Product dots render only for exact verified catalog bindings. No changes outside the inspiration section, its script/styles/data and associated tests/assets.

- [x] Inspect original scenes, dialog, catalog adapter, geometry helper and supplied images.
- [x] Test the six-second timeline, wrap, interaction resets, reduced motion, teardown and catalog validation before implementing it.
- [x] Add the supplied 1672×941 photos and nine separately configurable points, leaving unverified IDs null.
- [x] Replace the mosaic with 25/75 columns, mobile room row, captions, progress and accessible pause.
- [x] Implement an 800ms neighboring-layer transition, preload images, hover/focus/dialog/swipe/visibility pauses and cleanup.
- [x] Review changes, run all checks and publish to the existing Vercel project.
- [x] Verify two real automatic cycles, wrap, controls, responsive layout and swipe in browser; report unbound products and verification limits.

Verification: npm run check and all 42 tests pass. Browser checked at 1440, 1024, 768 and 390px; automatic change counter exceeded six transitions on final deployment, pause held its scene and count, room/indicator/keyboard/drag selection worked. Reduced motion and teardown verified by clock tests and code review; OS reduced-motion setting was not changed. Actual product popovers remain untestable on production because all nine product bindings are intentionally null.
