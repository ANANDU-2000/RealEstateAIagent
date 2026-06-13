# PropAgent V3

Real Estate Operating System — WhatsApp AI agent, CRM, property management, and booking for India, UAE, and Canada.

## Stack

| Layer | Service |
|-------|---------|
| Frontend | Next.js 15 on Vercel |
| Backend | Node.js + Express on Render |
| Database | Render PostgreSQL |
| Files | Cloudflare R2 |
| Realtime | Socket.IO |
| Auth | Custom JWT (bcrypt) |

## Project Structure

```
propagent/
├── backend/          # Express API → Render
├── frontend/         # Next.js app → Vercel
├── docs/             # Specs & tracking
├── files/            # Original planning docs
└── render.yaml       # Render Blueprint
```

## Local Development

```bash
# Install dependencies
npm install

# Backend (port 3001)
cp backend/.env.example backend/.env   # fill in values
npm run dev:backend

# Frontend (port 3000)
cp frontend/.env.example frontend/.env.local
npm run dev:frontend
```

## Documentation

- [AGENTS.md](./AGENTS.md) — Agent workflow & guardrails
- [docs/tracking/](./docs/tracking/) — Progress, tasks, checklist
- [files/MASTER-PLAN.md](./files/MASTER-PLAN.md) — Product master plan
- [render-postgres-only.md](./render-postgres-only.md) — DB & deployment guide

## Live Infrastructure

- **Backend:** https://realestateaiagent-0ubp.onrender.com
- **GitHub:** https://github.com/ANANDU-2000/RealEstateAIagent
