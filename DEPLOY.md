# Publish GP Royal Farm with GitHub Pages

This folder is the complete static website. Upload **the contents of this folder** to the root of a GitHub repository.

## First deployment

1. Create a new public repository on GitHub, for example `gp-royal-farm`.
2. Upload `index.html`, `assets`, `.nojekyll`, and this file to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. GitHub will publish the site at `https://YOUR-USERNAME.github.io/gp-royal-farm/`.

The website is fully static. The WhatsApp booking form, gallery, animations, maps link, phone links, and Instagram link run in the browser and do not require PHP.

## Updating the website

Make changes in the main PHP project first, regenerate this static export, and upload the refreshed files to the same repository.
