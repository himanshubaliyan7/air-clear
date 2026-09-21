# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Air-quality frontend

Frontend only. The backend already exists; nothing here computes AQI values,
categories, thresholds, verdicts or recommendations.

### Configuration

Set `VITE_API_BASE_URL` to the API base URL, no trailing slash. It must be `https://`:
the app is served over https and browsers block insecure requests. The API must also
allow this site's origin (CORS). See `.env.example`.

### Commands

- `npm run gen:api` — regenerates `src/api/schema.gen.ts` from `docs/openapi.json`.
  Re-run this every time the API spec changes, after replacing `docs/openapi.json`.
- `npm run test` — Vitest unit tests (`npm run test:watch` to watch).

Anything the API does not provide is recorded in `BACKEND_REQUESTS.md`, never faked.
