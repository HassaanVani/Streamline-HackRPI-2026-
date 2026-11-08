# Netlify frontend deployment

The repository-root `netlify.toml` configures a static frontend. Python jobs continue running on Vultr; Netlify does not deploy FastAPI or Docker Compose.

## Import settings

- Repository: HassaanVani/Streamline-HackRPI-2026-
- Production branch: main
- Base directory: frontend
- Build command: npm run build
- Publish directory: dist (relative to frontend)
- Functions directory: leave unset
- Node: 22.16.0, configured in netlify.toml
- Environment variables: none required. Remove any dashboard override for VITE_API_BASE_URL; it must be empty for the same-origin proxy.

Reload the import form after the configuration commit is pushed. Netlify should discover these settings automatically. No additional paid services are required by this configuration; inspect the selected account plan before deploying.

## API and saved replay

The first rewrite proxies `/api/*` to `http://66.135.1.179/api/:splat`; the SPA fallback comes last. Browser requests remain on the HTTPS Netlify origin, avoiding mixed-content requests and cross-origin configuration. The Netlify-to-Vultr hop currently uses HTTP, matching the existing IP deployment; end-to-end TLS requires a backend hostname and certificate, then updating the proxy target. Do not send credentials or personal information through this demo API.

Bundled airports, geography, both theme assets and all twelve saved scenarios are static frontend files. Saved journeys and prediction experiments remain usable when the backend is offline; new journeys require Vultr. Keep the Vultr instance running for calculations. Update the proxy target if its IP changes.

## Verify after the first deploy

1. Open the Netlify HTTPS URL and `/api/v1/health`; expect JSON with ready=true, not index.html.
2. Exercise saved JFK–LHR, reverse direction, still air, and the Atlantic invitation with keyboard focus.
3. Switch Clouds/ATC and reload; check logo, favicon and preference persistence.
4. Run `python3 scripts/check_public.py https://YOUR-SITE.netlify.app --output /tmp/streamline-netlify-smoke.json`.
5. Once, verify a new journey with `--uncached`; avoid repeated weather downloads.
6. Check desktop and phone. Replace Devpost's demo link only after these checks pass.

Build preparation is not proof of a successful Netlify deployment. Record the resulting URL and checks after publishing.
