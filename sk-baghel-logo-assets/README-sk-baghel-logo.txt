SK BAGHEL TOUR & TRAVELS — LOGO ASSETS

Files
- sk-baghel-logo.svg: primary horizontal logo for light backgrounds.
- sk-baghel-logo-inverse.svg: inverse horizontal logo for dark backgrounds.
- sk-baghel-mark.svg: standalone SK mark; use for favicon/app icon or very compact placements.

These files are clean, vector-based SVGs. They contain no embedded raster images and no live text nodes; the wordmark is converted to vector paths, so font availability does not change its appearance.

Suggested placement in a React/Next.js project
1. Copy the SVG files into public/logos/.
2. Use the primary logo for the header and footer on light surfaces:
   <img src="/logos/sk-baghel-logo.svg" alt="SK Baghel Tour & Travels" width="250" height="77" />
3. Use sk-baghel-logo-inverse.svg on dark surfaces.
4. Use sk-baghel-mark.svg for compact placements. For favicons, add a favicon SVG link in the document head and test it in target browsers.
5. Do not stretch the logo. Keep width auto/height auto or preserve its aspect ratio.

Colors
- Deep teal: #0B3440
- Copper: #C77C4D
- Light inverse: #F7F3EA
