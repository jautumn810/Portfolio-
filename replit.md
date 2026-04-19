# TruckLink — Professional Trucking SaaS Platform

## Overview
TruckLink is a full-stack professional trucking SaaS platform connecting shippers, carriers, dispatchers, and drivers.

## Architecture

### Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL
- **API**: RESTful JSON API, OpenAPI spec, Zod validation, JWT auth
- **UI Library**: Recharts (analytics), React Leaflet (maps), date-fns, Lucide icons

### Monorepo Structure
```
artifacts/
  trucklink/        # React/Vite frontend (port 24534, preview at /)
  api-server/       # Express backend (port 8080)
  mockup-sandbox/   # Design sandbox (unused)
lib/
  api-client-react/ # Generated Orval API client (react-query hooks)
  api-zod/          # Generated Zod schemas for API validation
  db/               # Drizzle schema + db connection
```

## Frontend Pages
- `/` — Landing page (public marketing page)
- `/login` — JWT authentication login with quick demo buttons
- `/register` — User registration with role selection
- `/dashboard` — KPI cards + Recharts (line, bar, pie charts)
- `/trucks` — Fleet grid with status filters (10+ trucks)
- `/loads` — Load board with status/bid info
- `/loads/:id` — Load detail + bidding interface
- `/map` — React Leaflet live fleet map with truck markers
- `/routes` — Route optimizer with waypoints and alternatives
- `/profile` — User profile with edit + recent bids

## Backend API Routes (all under /api)
- `POST /api/auth/login` — Login, returns JWT
- `POST /api/auth/register` — Register
- `GET /api/auth/me` — Current user
- `GET /api/trucks` — List trucks (with filter params)
- `GET /api/trucks/telematics` — Live truck positions
- `GET /api/loads` — Load board
- `GET /api/loads/:id` — Load detail
- `GET /api/loads/:id/bids` — Load bids
- `POST /api/bids` — Place bid
- `PATCH /api/bids/:id` — Accept/reject bid
- `GET /api/analytics/dashboard` — KPI stats
- `GET /api/analytics/loads` — Monthly load chart data
- `GET /api/analytics/revenue` — Monthly revenue chart data
- `POST /api/chat/message` — Chatbot
- `POST /api/routes/optimize` — Route optimizer

## Database (PostgreSQL via Drizzle ORM)
Tables: `users`, `trucks`, `loads`, `bids`

## Demo Accounts (password: password123)
- admin@trucklink.com — Admin
- sarah@trucklink.com — Dispatcher
- mike@trucklink.com — Driver
- james@trucklink.com — Carrier
- lisa@trucklink.com — Shipper

## Key Design Decisions
- **Dark theme**: HSL 220 20% 7% background, crimson red (#dc2626) primary
- **JWT stored in localStorage** (user's explicit requirement, not session cookies)
- **Vite proxy**: `/api` → `http://localhost:8080` for local development
- **Glassmorphism**: `.glass` utility class, backdrop-blur
- **Route optimizer**: Haversine formula for distance calculation
- **Seed script**: `artifacts/api-server/src/seed.ts`

## Running the App
1. `pnpm dlx tsx artifacts/api-server/src/seed.ts` — Seed database
2. Both workflows run automatically: API Server + Trucklink web

## Environment Secrets
- `SESSION_SECRET` — Used for JWT signing (in lib/auth.ts)
- `DATABASE_URL` — PostgreSQL connection string
