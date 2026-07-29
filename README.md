# FTC KJSSE Website

Static website for the FTC KJSSE Finance & Tech Council.

## Structure

- `index.html` contains the page markup.
- `css/main.css` imports modular styles from `base`, `components`, `sections`, and `utilities`.
- `js/app.js` is the entry point for feature modules.
- `js/features` contains UI behavior.
- `js/services` contains API/data helpers.
- `assets/images` contains static image assets.

## Local Preview

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.
