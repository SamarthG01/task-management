# TaskFlow — Frontend

React + Vite frontend for the Team Task Manager.

## Tech Stack
- React 18 + Vite 5
- React Router v6 (client-side routing)
- Axios (API calls with JWT interceptor)
- Recharts (dashboard charts)

## Local Development

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Set up environment
cp .env.example .env
# If running backend locally, no changes needed (Vite proxies /api → localhost:8000)
# If connecting to deployed backend, set VITE_API_URL in .env

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

## Production Build

```bash
npm run build
# Output: dist/ folder — serve with any static host or Railway
```

## Deployment (Railway)

1. In Railway, add a new service from your GitHub repo
2. Set **Root Directory** to `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npx serve dist`
5. Set env var: `VITE_API_URL=https://<your-backend>.railway.app/api/v1`

## Folder Structure

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── src/
    ├── main.jsx          # Entry point
    ├── App.jsx           # Router + auth guard
    ├── index.css         # Global styles + CSS variables
    ├── api/
    │   └── client.js     # Axios instance + all API calls
    ├── context/
    │   └── AuthContext.jsx  # Global auth state (JWT)
    ├── components/
    │   ├── ui/
    │   │   └── index.jsx    # Reusable: Button, Input, Modal, Badge, etc.
    │   ├── layout/
    │   │   └── AppLayout.jsx  # Sidebar navigation
    │   ├── auth/
    │   │   ├── LoginPage.jsx
    │   │   └── SignupPage.jsx
    │   ├── projects/
    │   │   ├── ProjectsPage.jsx      # Project list + create
    │   │   └── ProjectDetailPage.jsx # Board + members tabs
    │   ├── tasks/
    │   │   ├── TaskCard.jsx          # Card with status advance
    │   │   ├── CreateTaskModal.jsx   # Admin task creation
    │   │   └── MyTasksPage.jsx       # Member's personal task list
    │   └── dashboard/
    │       └── DashboardPage.jsx     # Charts + stats per project
```
