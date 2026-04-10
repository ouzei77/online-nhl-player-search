# Online NHL Player Search

A full-stack web application for searching and viewing NHL player profiles and statistics, built with [React Router 7](https://reactrouter.com/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/). Original version was handbuilt, and this iteration is heavily AI-assisted by Cursor.

## Features

- 🏒 Search for any active or historical NHL player by name
- 📊 View detailed player stats — current season, career totals, and last 5 games
- 🏆 See player awards and achievements
- 🚀 Server-side rendering via Cloudflare Workers
- ⚡️ Hot Module Replacement (HMR) during local development
- 🔒 TypeScript throughout
- 🎉 TailwindCSS for styling
- 🔎 Built-in Cloudflare observability

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ouzei77/online-nhl-player-search.git
cd online-nhl-player-search
npm install
```

### Development

Start the local development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

The Cloudflare Workers environment is emulated locally by Miniflare (built into Wrangler), so no Cloudflare account is required to run the app locally.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run cf-typegen` | Regenerate TypeScript types from `wrangler.json` bindings |
| `npm run check` | Type-check, build, and dry-run deploy |

## Project Structure

```
online-nhl-player-search/
├── app/                    # React Router application
│   ├── routes/             # File-based routes
│   │   ├── home.tsx        # Home / search page
│   │   └── player.tsx      # Player profile page
│   ├── components/         # Shared UI components
│   ├── types/              # Shared TypeScript types
│   └── root.tsx            # App shell (HTML document)
├── workers/                # Cloudflare Worker entry points
│   ├── app.ts              # Main Worker — routes requests to React Router or API
│   └── nhl-api.ts          # NHL API proxy handler
├── docs/                   # Project documentation
│   ├── architecture.md     # App architecture overview
│   └── nhl-api-landing-endpoint.md  # NHL API reference
├── public/                 # Static assets
├── wrangler.json           # Cloudflare Workers configuration
└── vite.config.ts          # Vite + Cloudflare plugin configuration
```

For a deeper explanation of how the pieces fit together, see [docs/architecture.md](docs/architecture.md).

## How It Works

1. A user types a player name into the search box on the home page.
2. The browser calls the `/nhl/` API proxy that runs inside the Cloudflare Worker.
3. The Worker fetches data from the public NHL API (`https://api-web.nhle.com/`) and returns it as JSON.
4. The React Router frontend renders the player profile page with stats, awards, and recent games.

See [docs/nhl-api-landing-endpoint.md](docs/nhl-api-landing-endpoint.md) for full details on the NHL API response format.

## Deployment

If you don't have a Cloudflare account, [create one for free](https://dash.cloudflare.com/sign-up). Then run:

```bash
npm run build
npm run deploy
```

To upload a preview version without promoting it to production:

```bash
npx wrangler versions upload
npx wrangler versions deploy
```

## Styling

The project uses [Tailwind CSS v4](https://tailwindcss.com/) via the `@tailwindcss/vite` plugin.

---

Built with ❤️ using React Router and Cloudflare Workers.
