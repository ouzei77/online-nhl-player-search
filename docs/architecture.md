# Architecture: Online NHL Player Search

This document describes the high-level architecture of the Online NHL Player Search application, which is built on **React Router 7** and deployed as a **Cloudflare Worker**.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | [React Router 7](https://reactrouter.com/) (v7 framework mode) |
| Runtime / hosting | [Cloudflare Workers](https://workers.cloudflare.com/) |
| Build tool | [Vite](https://vitejs.dev/) with [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Language | TypeScript |
| Local emulation | [Miniflare](https://miniflare.dev/) (bundled with Wrangler) |

---

## High-Level Request Flow

```
Browser
  │
  │  HTTP request
  ▼
Cloudflare Worker  (workers/app.ts)
  │
  ├─ /nhl/*  ──────────────────────►  NHL API Proxy  (workers/nhl-api.ts)
  │                                        │
  │                                        │  fetch()
  │                                        ▼
  │                                   NHL Web API
  │                                   api-web.nhle.com
  │
  └─ everything else  ─────────────►  React Router SSR handler
                                          │
                                          │  renders HTML
                                          ▼
                                      app/routes/*.tsx
```

### Step-by-step

1. **Request arrives** at the Cloudflare Worker entry point (`workers/app.ts`).
2. The Worker inspects the URL path:
   - Paths that begin with `/nhl/` are forwarded to the NHL API proxy handler (`workers/nhl-api.ts`), which fetches data from `https://api-web.nhle.com/` and returns JSON.
   - All other paths are handled by the React Router server-side rendering (SSR) handler, which renders the appropriate route from `app/routes/`.
3. **Responses** are sent back to the browser. For page navigations the Worker returns full HTML; for client-side navigations React Router fetches loader data as JSON.

---

## Directory Structure

```
online-nhl-player-search/
│
├── app/                        # React Router application code
│   ├── root.tsx                # App shell — defines the HTML document,
│   │                           # global providers, and error boundary
│   ├── routes.ts               # Route manifest (maps URLs → route modules)
│   ├── routes/
│   │   ├── home.tsx            # "/" — search form
│   │   └── player.tsx          # "/player/:id" — player profile & stats
│   ├── components/             # Shared UI components (cards, tables, etc.)
│   ├── types/                  # Shared TypeScript interfaces / types
│   ├── app.css                 # Tailwind CSS entry point
│   └── Global.css              # Global baseline styles
│
├── workers/                    # Cloudflare Worker source
│   ├── app.ts                  # Worker entry point; routes between SSR and API
│   └── nhl-api.ts              # Proxy to the public NHL API
│
├── public/                     # Static assets served as-is
│
├── docs/                       # Project documentation
│   ├── architecture.md         # This file
│   └── nhl-api-landing-endpoint.md  # NHL API response shape reference
│
├── wrangler.json               # Cloudflare Workers configuration
│                               # (name, compatibility flags, env vars)
├── vite.config.ts              # Vite build configuration
├── react-router.config.ts      # React Router framework configuration
├── tsconfig.json               # TypeScript config for the app
└── tsconfig.cloudflare.json    # TypeScript config for the Worker
```

---

## Key Files Explained

### `workers/app.ts` — Worker entry point

This is the single entry point that Cloudflare runs for every incoming HTTP request. It:

- Uses `createRequestHandler` from `react-router` to build an SSR handler that is backed by the compiled React Router application bundle.
- Checks the request URL; if the path starts with `/nhl/` the request is delegated to `handleNhlApi()`.
- Passes the Cloudflare `env` and `ctx` objects into React Router's load context so that route loaders and actions can access Cloudflare bindings (environment variables, KV, D1, etc.).

### `workers/nhl-api.ts` — NHL API proxy

Acts as a thin proxy between the browser and the public NHL web API. Running the proxy in the Worker rather than fetching directly from the browser allows:

- **CORS handling** — the Worker sets appropriate response headers so the browser does not hit cross-origin restrictions.
- **Future caching / rate-limiting** — a Worker can cache responses in the Cloudflare edge cache or add rate-limiting without any changes to the React frontend.

The proxy forwards requests to `https://api-web.nhle.com/v1/` and relays the JSON response. See [nhl-api-landing-endpoint.md](nhl-api-landing-endpoint.md) for the full shape of the player landing endpoint.

### `app/routes/home.tsx` — Search page

The root route (`/`). Contains the player search form. On submit, the form navigates to the player route with the selected player's NHL ID.

### `app/routes/player.tsx` — Player profile page

The player route (`/player/:id`). The route loader calls the `/nhl/` proxy to fetch the player's data from the NHL API during SSR, so the page is fully rendered on the server before being sent to the browser.

### `react-router.config.ts`

Configures React Router's framework mode. Enables SSR and tells the Vite plugin to use the `workers/app.ts` Worker as the server.

### `wrangler.json`

Cloudflare Workers configuration file. Specifies:

- `name` — the Worker name used as the default `*.workers.dev` subdomain.
- `main` — the Worker entry point (`workers/app.ts`).
- `compatibility_date` / `compatibility_flags` — pin the Workers runtime behaviour and enable `nodejs_compat` so Node.js built-ins are available.
- `vars` — environment variables injected into the Worker at runtime (e.g. `CLIENT_ORIGIN` for CORS).
- `observability` — enables Cloudflare's built-in request tracing and logging.

---

## Local Development

During `npm run dev`, Vite starts with the `@cloudflare/vite-plugin`. The plugin:

1. Compiles the Worker entry point and the React Router application in watch mode.
2. Launches **Miniflare** (Cloudflare's open-source local emulator) to simulate the Workers runtime on your machine.
3. Proxies all requests through Miniflare so that Cloudflare APIs (`env`, `ctx`, `caches`, etc.) behave the same locally as they do in production.

No Cloudflare account or internet connection is required to develop locally.

---

## Data Flow: Player Search

```
1. User submits search form (home.tsx)
         │
         ▼
2. Browser navigates to /player/{id}
         │
         ▼
3. React Router SSR loader in player.tsx runs on the Worker
         │
         ├─► fetch("/nhl/player/{id}/landing")
         │           │
         │           ▼
         │     workers/nhl-api.ts fetches from NHL API
         │           │
         │           ▼
         │     JSON response returned to loader
         │
         ▼
4. Player data is passed as props to the React component
         │
         ▼
5. Worker renders HTML and streams it to the browser
         │
         ▼
6. React hydrates the page for client-side interactivity
```

---

## Environment Variables

Environment variables are defined in `wrangler.json` under `vars` and are available in both the Worker code and React Router loaders via `context.cloudflare.env`.

| Variable | Description |
|----------|-------------|
| `VALUE_FROM_CLOUDFLARE` | Example variable showing how Cloudflare env vars work |
| `CLIENT_ORIGIN` | Allowed CORS origin for the NHL API proxy (`*` by default) |

For production secrets (API keys, tokens), use [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/) instead of `vars`.

---

## Deployment

The application is deployed as a single Cloudflare Worker that handles both the SSR React application and the NHL API proxy. Running `npm run deploy` (which runs `wrangler deploy`) uploads the compiled Worker bundle to Cloudflare's global edge network and makes it available at `https://online-nhl-player-search.<account>.workers.dev`.
