# Tech Stack

## Frontend
- **Framework**: React 19 (JSX, functional components, hooks only — no class components)
- **Build tool**: Vite 7
- **Routing**: React Router DOM v6 (`<Routes>` / `<Route>` / `<Navigate>`)
- **Styling**: Tailwind CSS v3 (utility-first; no CSS modules or styled-components)
- **Animation**: Framer Motion
- **Icons**: Lucide React (pinned to `0.469.0`)
- **Charts**: Recharts
- **Flow diagrams**: ReactFlow
- **Particles**: react-tsparticles + tsparticles-slim
- **Utilities**: clsx, tailwind-merge
- **AI**: `@google/generative-ai` (Gemini 2.5 Flash)

## Backend (Express server — `server/`)
- **Runtime**: Node.js (CommonJS `require`/`module.exports`)
- **Framework**: Express 4
- **Database**: MySQL 2 (connection pool via `server/config/db.js`)
- **AI**: `@google/generative-ai`
- **Other**: cors, body-parser, nodemon (dev)

## Data Layer — Important Architecture Note
The frontend currently uses **localStorage exclusively** via `src/services/jsonStore.js`. The Express backend (`server/`) exists but is **not called by the frontend** except for two Vercel serverless functions (`/api/aqi`, `/api/news`). All auth, diagnosis, profile, and check-in operations go through `jsonStore`.

- `src/services/api.js` — thin wrapper over `jsonStore`; this is the only import components should use for data access
- `src/services/authService.js` — thin wrapper over `jsonStore` for auth; used by `AuthContext`
- `src/context/AuthContext.jsx` — provides `useAuth()` hook (`user`, `login`, `register`, `logout`, `loading`)

## localStorage Keys
| Key | Contents |
|-----|----------|
| `respira_users` | All registered users (array) |
| `respira_current_user` | Active session user (object, no password) |
| `respira_diagnosis_logs` | All diagnosis log entries |
| `respira_checkins` | Daily check-in records |

## Deployment
- **Frontend**: Vercel — `vercel.json` rewrites all routes to `index.html` (SPA)
- **Backend**: Railway — `railway.json` sets root to `/server`, start command `node index.js`

## Common Commands

```bash
# Frontend dev server
npm run dev

# Frontend production build
npm run build

# Frontend lint
npm run lint

# Backend dev (with nodemon)
cd server && npm run dev

# Backend production
cd server && npm start
```

## ESLint
- Config: `eslint.config.js` (flat config format)
- Rules: `no-unused-vars` errors for variables not matching `^[A-Z_]`
- Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
