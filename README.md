
# RSSchool CV

This repo generates one or more HTML CV pages from Markdown sources.

## Quick start

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Edit the source Markdown:

   - `cv.md` is the main CV.
   - Any other `*.md` files (except `README.md`) will also be built.

3. Build:

   ```bash
   npm run build
   ```

4. Open the generated HTML from `dist/`:

   - `dist/cv.html`
   - `dist/<other-file>.html`

## Project layout

- `cv.md` — primary CV source (Markdown).
- `template.ejs` — HTML template.
- `generate-cv.js` — build script (Markdown → HTML).
- `assets/` — styles, images, icons.
- `dist/` — generated output (HTML + copied assets).

## Sharing your workflow

If you want a collaborator to follow the exact flow:

1. Clone the repo.
2. Run `npm ci`.
3. Edit `cv.md` and/or add another `*.md` for variations.
4. Run `npm run build`.
5. Review output in `dist/`.

## Links

<https://ivmoskalev.github.io/rsschool-cv/cv>
<https://ivmoskalev.github.io/rsschool-cv/>
