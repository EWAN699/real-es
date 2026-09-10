Media lives here as `public/media/{section-id}/{variant}.{ext}`, per
`contracts/assets.md`. Drop originals in, then run:

    npm run media:optimize     # convert + poster frames
    npm run media:check        # report only; exits 1 if anything is over budget

`{section-id}` must match a section `id` in `content/pages.json` exactly.
