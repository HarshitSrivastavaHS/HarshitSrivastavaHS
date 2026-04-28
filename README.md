# Harshit Srivastava Portfolio

Static multi-page portfolio built for GitHub Pages.

## Structure

- `index.html`: KDE-inspired home workspace with the Dolphin-style explorer
- `projects.html`: project gallery and live links
- `posters.html`: poster gallery
- `assets/css/styles.css`: shared styling
- `assets/js/site.js`: shared rendering logic
- `data/site.json`: main editable content source

## Editing content

Most updates should happen in `data/site.json`.

- Update landing-page copy in `profile`, `home`, and `explorer`
- Add or remove explorer folders in `explorer.folders`
- Add or remove projects in `projects.items` and `projects.websites`
- Add or remove poster entries in `posters.items`
- Update contact links in `contact`
- Update navigation labels or targets in `navigation`

## Hosting

This site is static and works on GitHub Pages without a build step.

If you preview locally, use a simple local server so `fetch("data/site.json")` works. For example:

```bash
python3 -m http.server
```
