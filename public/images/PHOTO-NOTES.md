# Image organization (definitive map)

Every image lives in a folder named for what it belongs to. When adding new
images, drop them in the matching folder and reference as /images/<folder>/<file>.

## Folders
- boh/          Bank of Hawaii. ON SITE (BOH 4-frame rotation, 2026-07-10):
                logo → clark-peter-ho (Clark + CEO Peter Ho, from
                ImagesForSite/Clark+BOH_CEO 5774px original) →
                boh-intern-cohort (from BOH.jpg) → boh-volunteer-group
- sucui/        Credit union initiative. ON SITE (SUCUI 4-frame rotation,
                2026-07-10): logo → sucui-team → sucui-group (from
                SUCUI_GroupPhoto.JPG) → sucui-team-2. Bench: sucui-team-full
                (print size). ImagesForSite/_MG_2887.CR2 (Dempsey booth) is
                convertible but underexposed; passed over.
- hawaii/       hawaii-coast.jpg (ON SITE: Rooted gallery), hawaii-sunset.jpg (bench)
- seattle/      seattle-space-needle.jpg (ON SITE: Rooted gallery),
                bench: mount-rainier-lake.jpg, lumen-field-worldcup.jpg
- japan/        tokyo-skytree-dusk.jpg (ON SITE: Rooted gallery),
                sophia-basketball-group.jpg (ON SITE: Sophia crossfade),
                bench: cherry-blossoms, byodoin-temple(-pond), asakusa-sensoji,
                market-lanterns, sophia-basketball-group-2
- italy/        ON SITE (Italy rotation, updated 2026-07-10): italy-study-tour-group,
                wine-barrels, assisi-basilica, arezzo-tower. ON SITE (Rooted
                gallery): tuscan-vineyards. ON SITE (experiment journey stop):
                assisi-basilica-overlook. Bench: rome-skyline, colosseum,
                colosseum-night, rome-monument, spanish-steps,
                trinita-dei-monti, trevi-fountain.
                Sources: wine-barrels ← ImagesForSite/IMG_8543, arezzo-tower ←
                IMG_7519, assisi-basilica-overlook ← IMG_8574 (all resized to
                1600px, q82). Note: ImagesForSite/IMG_8242 = tuscan-vineyards
                and IMG_8567 = assisi-basilica (same shots, already on site).
- logos/        Org marks (use the .png versions; any .jpg twins are superseded
                originals that couldn't be deleted). ON SITE: bank-of-hawaii,
                sucui, su-rec, su-athletics, su-seal, applied-analytics,
                hui-o-nani, sophia, punahou, eagle-scout, nex
- intramurals/  intramural-champs.jpg (ON SITE: UREC crossfade, from
                ImagesForSite/DSC06413). Still wanted: officiating shots
- design/       EMPTY. Waiting on the blue Japanese poster series + Tokyo badges
- personal/     Superseded duplicates only (kept because deletion is restricted);
                canonical copies live in boh/ and sucui/

## src/assets/work/ (Selected Work thumbnails, added 2026-07-30)

These are the ONLY images not under public/. They live in src/ on purpose so
astro:assets can emit AVIF/WebP plus a srcset; reference them by importing in
src/data/projects.ts, never by URL path. Masters are 1440x900 (16:10) so the
rendered aspect ratio never crops. Charts and dashboards are padded to 16:10 on
their own background rather than cropped, because cropping cut axis labels.

- intramural-activation.png       Retention by first-year games played.
                                  Source: im-analytics/deck_assets/
                                  s08_activation_staircase.png (Clark's chart).
                                  Chosen over s06/s09/s10/s11/s12/s13: the only
                                  candidates legible at 224px were s08/s09/s11.
- zippys-korean-fried-chicken.jpg Zippy's KFC plate lunch. Source: Case Studies:
                                  Projects/Zippys-Portfolio-Prototype-v2/images/
                                  zippys/. Zippy's own product photography, used
                                  under the revised imagery test in CLAUDE.md
                                  (subject is the subject). Clark chose this over
                                  rendering the CSS poster, 2026-07-30.
- hawaii-value-stays-dashboard.png Tableau dashboard. Source: base64 embedded in
                                  Case Studies:Projects/hawaii-value-stays-case-
                                  study .html, extracted 2026-07-30.

Rows with no genuine artifact render with NO thumbnail, by design. Currently
without one: Seattle Building Permit, Real Estate Lead Analytics, Tokyo Airbnb
Pricing, Clark's Reading Notes.

## Wanted (would upgrade the site)
- St. Francis statue photo (Clark pasted it in chat 2026-07-10 but the file
  is not in ImagesForSite; re-send as a file) -> italy/, Italy rotation
- Tableau screenshots: Tokyo Airbnb + Intramural dashboards -> case study pages
- UREC officiating/manager photo -> intramurals/
- Poster series files -> design/ (unlocks a Visual Communication work item)

## Approved and shipped 2026-07-10 (Clark said yes to all three)
- BOH rotation: + clark-peter-ho, + boh-intern-cohort
- UREC crossfade: + intramural-champs
- SUCUI rotation: + sucui-group, + sucui-team-2 (bench promotion)
