#!/usr/bin/env bash
# Build and deploy this app to Cloudflare Workers, now that Lovable's own
# publish flow is unavailable. Nitro's `cloudflare-module` preset (already
# configured via @lovable.dev/vite-tanstack-config) produces a real Workers
# deploy config at .output/server/wrangler.json on every build - this script
# just builds and pushes it with Wrangler.
#
# Requires:
#   - CLOUDFLARE_API_TOKEN env var, a token scoped with the "Edit Cloudflare
#     Workers" template (dash.cloudflare.com -> profile icon -> My Profile ->
#     API Tokens -> Create Token). One-time account setup: the account needs
#     a workers.dev subdomain registered (Workers & Pages -> Account details
#     in the dashboard shows/sets it) before the first deploy.
#   - VITE_API_BASE_URL env var, the backend's HTTPS URL (baked in at build
#     time, e.g. https://137-23-49-72.sslip.io or a future real domain).
#
# Usage:
#   CLOUDFLARE_API_TOKEN=... VITE_API_BASE_URL=https://... ./scripts/deploy-cloudflare.sh
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (see comment above for how to generate one)}"
: "${VITE_API_BASE_URL:?Set VITE_API_BASE_URL to the backend https:// URL}"

npm run build

# NOTE: if building from a machine/environment whose system clock is ahead of
# real-world time, Nitro stamps compatibility_date with that (wrong, future)
# date and Cloudflare's real API rejects it ("Can't set compatibility date in
# the future"). Not expected on a normal machine; if it happens, edit
# .output/server/wrangler.json's compatibility_date to a known-past date
# (e.g. "2025-01-01" - safe, doesn't gate any Workers feature this app uses)
# and re-run the deploy step below.
npx wrangler deploy --config .output/server/wrangler.json
