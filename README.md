# 📋 TaskFlow – Team Task Manager

> A full-stack collaborative task management web application. Built as part of a full-stack development assignment, TaskFlow lets teams create projects, assign tasks, and track progress in real time.

---

## 🌐 Live Demo

🔗 **Application URL:** `https://<your-railway-domain>.up.railway.app`

📁 **GitHub Repository:** `https://github.com/SamarthG01/taskflow`

---

## ✨ Features

- 🔐 **User Authentication** — Signup/Login with JWT-based secure sessions
- 🗂️ **Project Management** — Create projects, manage members (Admin/Member roles)
- ✅ **Task Management** — Create, assign, and update tasks with priority and due dates
- 📊 **Analytics Dashboard** — Visual metrics: task status breakdown, per-user load, overdue tasks
- 👤 **My Tasks View** — Personalized page showing only your assigned tasks
- 🛡️ **Role-Based Access Control** — Admins manage everything; Members view and update their own tasks

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React (Vite), React Router DOM, Recharts, Axios |
| Backend    | FastAPI (Python), SQLAlchemy (Async), Uvicorn    |
| Database   | PostgreSQL                        |
| Auth       | JWT (JSON Web Tokens)             |
| Deployment | Railway                           |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   └── auth.py          # JWT authentication logic
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Dashboard, Tasks, Projects, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── api/             # Axios API calls
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 💻 Local Setup & Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL installed and running locally

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/taskflow.git
cd taskflow
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Mac/Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

**Create a `.env` file in the `backend/` directory:**

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/taskflow_db
SECRET_KEY=your_super_secret_jwt_key
```

**Run database migrations:**

```bash
alembic upgrade head
```

**Start the FastAPI server:**

```bash
uvicorn app.main:app --reload
```

The backend will be running at: `http://localhost:8000`
API docs available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

**Create a `.env` file in the `frontend/` directory:**

```env
VITE_API_URL=http://localhost:8000/api/v1
```

**Start the development server:**

```bash
npm run dev
```

The frontend will be running at: `http://localhost:5173`

---

## 🌍 Deployment on Railway

This project is deployed using [Railway](https://railway.app/). Follow these steps to deploy your own instance.

### Step 1 — Deploy the Database

1. In your Railway project dashboard, click **+ New → Database → Add PostgreSQL**
2. Railway will automatically provision the database and generate a `DATABASE_URL` variable

---

### Step 2 — Deploy the Backend

1. Click **+ New → GitHub Repo** and select your TaskFlow repository
2. In the service **Settings → Deploy**, set the **Root Directory** to `/backend`
3. In the **Variables** tab, add:
   - `DATABASE_URL` → reference the PostgreSQL variable Railway generated
   - `SECRET_KEY` → a secure random string (e.g., from `openssl rand -hex 32`)
4. Under **Settings → Networking**, click **Generate Domain**
5. Ensure your FastAPI `CORSMiddleware` in `main.py` allows your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://<your-frontend-domain>.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Step 3 — Deploy the Frontend

1. Click **+ New → GitHub Repo** and select your TaskFlow repository again
2. In the service **Settings → Deploy**, set the **Root Directory** to `/frontend`
3. In the **Variables** tab, add:
   - `VITE_API_URL` → `https://<your-backend-railway-domain>.up.railway.app/api/v1`
4. Under **Settings → Networking**, click **Generate Domain**
5. Click **Deploy / Apply Changes**

Once both services show a green **"Success"** status, your app is live! 🎉

---

## 🔑 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/auth/signup` | Register a new user |
| POST   | `/api/v1/auth/login` | Login and receive JWT |
| GET    | `/api/v1/projects` | List all user projects |
| POST   | `/api/v1/projects` | Create a new project |
| GET    | `/api/v1/tasks` | List tasks (filtered by project/user) |
| POST   | `/api/v1/tasks` | Create a new task |
| PATCH  | `/api/v1/tasks/{id}` | Update task status or details |
| GET    | `/api/v1/dashboard` | Get dashboard analytics data |

Full interactive API docs: `http://localhost:8000/docs`

---

## 👥 Role-Based Access

| Feature                     | Admin | Member |
|-----------------------------|:-----:|:------:|
| Create / delete projects    | ✅    | ❌     |
| Add / remove members        | ✅    | ❌     |
| Create & assign tasks       | ✅    | ❌     |
| View assigned tasks         | ✅    | ✅     |
| Update own task status      | ✅    | ✅     |
| View dashboard analytics    | ✅    | ✅     |

---

## 📝 Environment Variables Reference

### Backend (`backend/.env`)

| Variable       | Description                            |
|----------------|----------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |
| `SECRET_KEY`   | Secret key for signing JWT tokens      |

### Frontend (`frontend/.env`)

| Variable        | Description                     |
|-----------------|---------------------------------|
| `VITE_API_URL`  | Base URL of the backend API     |

---

## 🚀 Running in Production (Manual)

If deploying without Railway:

```bash
# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (build for production)
npm run build
# Then serve the dist/ folder using nginx or a static host
```

---

## 📄 License

This project was built as part of a full-stack development assignment. Feel free to use it for learning purposes.

---

## 🙋 Author

**Your Name**
- GitHub: https://github.com/SamarthG01
- Email: samarthgohel01@gmail.com
