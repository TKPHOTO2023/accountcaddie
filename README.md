# Account Caddie website

Static site (no build step) for Account Caddie, a member of the New Generation Group.

- `index.html` — home page
- `pricing.html` — pricing (multi-currency: ZAR/USD/CAD/GBP)
- `css/style.css`, `js/main.js` — shared styles/behaviour (dark/light mode, scroll reveals, currency switcher)

## Local preview

Any static server works, e.g.:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in.
2. Import this GitHub repository (`TKPHOTO2023/accountcaddie`).
3. Framework preset: **Other** (it's a static site — no build command, no output directory needed).
4. Deploy. Vercel will pick up `vercel.json` automatically for clean URLs (`/pricing` instead of `/pricing.html`).
5. Every push to `main` will auto-deploy; pushes to other branches get their own preview URL.

To point a custom domain (e.g. `accountcaddie.co.za`) at the deployment, add it under the Vercel project's **Settings → Domains** and update the domain's DNS as instructed there.
