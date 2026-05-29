# 🎮 Esports League Management Platform

A full-stack web application for managing esports tournaments, teams, players, and match results. Built with **FastAPI** on the backend and **React + Vite** on the frontend.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-9.7-orange?logo=mysql)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)

---

## 📸 Preview

> Login page with neon esports aesthetic, tournament management, team rosters, and match scheduling.

---

## ✨ Features

- 🔐 **JWT Authentication** — Access + refresh token system with auto-renewal
- 👤 **Role-based access** — Admin and Player roles with different permissions
- 🏆 **Tournament Management** — Create, browse, and register for tournaments
- 👥 **Team System** — Create teams, manage rosters, send invites
- 📅 **Match Scheduling** — View upcoming matches, admins can enter results
- 🎮 **Game Profiles** — Players link their in-game name and rank per game
- 📊 **Player Stats** — Track scores and ACS per match

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.12 | Backend language |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM — database interaction |
| MySQL 9.7 | Relational database |
| PyMySQL | MySQL driver for Python |
| Pydantic v2 | Data validation and schemas |
| python-jose | JWT token creation and decoding |
| passlib + bcrypt | Password hashing |
| Uvicorn | ASGI server |
| Alembic | Database migrations |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| React Router DOM | Client-side routing |
| Zustand | Global state management |
| Axios | HTTP client with interceptors |
| Lucide React | Icon library |

---

## 📁 Project Structure

```
esports-platform/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py        # Settings loaded from .env
│   │   │   └── security.py      # JWT auth, password hashing
│   │   ├── models/
│   │   │   └── __init__.py      # SQLAlchemy database models
│   │   ├── schemas/
│   │   │   └── __init__.py      # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py          # Login, register, refresh, /me
│   │   │   ├── games.py         # Games CRUD
│   │   │   ├── players.py       # Player profiles
│   │   │   ├── teams.py         # Teams and members
│   │   │   ├── tournaments.py   # Tournaments and registration
│   │   │   └── matches.py       # Matches and results
│   │   ├── database.py          # DB engine and session
│   │   └── main.py              # FastAPI app entry point
│   ├── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── store/
    │   │   └── authStore.js     # Zustand auth state
    │   ├── lib/
    │   │   └── api.js           # Axios instance + token interceptors
    │   ├── components/
    │   │   ├── Layout.jsx       # Sidebar + navigation shell
    │   │   └── ui/index.jsx     # Reusable UI components
    │   ├── pages/               # One file per page/route
    │   ├── App.jsx              # Route definitions + auth guards
    │   └── main.jsx             # React entry point
    ├── vite.config.js           # Vite + /api proxy config
    └── tailwind.config.js       # Custom neon theme
```

---

## 🚀 Getting Started

### Prerequisites

- [Python 3.12](https://www.python.org/downloads/release/python-31210/)
- [Node.js 18+](https://nodejs.org/)
- [MySQL 9.7](https://dev.mysql.com/downloads/mysql/)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) *(Windows only)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/esports-platform.git
cd esports-platform
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MySQL credentials
```

#### .env Configuration

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/esports
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:5173"]
```

#### Create the database

```sql
mysql -u root -p
CREATE DATABASE esports;
exit
```

#### Run the backend

```bash
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 4. Seed Demo Data *(optional)*

```bash
cd backend
python seed.py
```

This creates demo users, teams, tournaments, and matches.

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@esports.gg | admin123 |
| Player | shadow@esports.gg | shadow123 |

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create a new account | Public |
| POST | `/api/auth/login` | Login and get tokens | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/me` | Get current user | Required |
| GET | `/api/games` | List all games | Required |
| GET | `/api/teams` | List all teams | Required |
| POST | `/api/teams` | Create a team | Player |
| GET | `/api/tournaments` | List tournaments | Required |
| POST | `/api/tournaments` | Create tournament | Admin |
| POST | `/api/tournaments/:id/register` | Register for tournament | Player |
| GET | `/api/matches` | List matches | Required |
| POST | `/api/matches` | Create a match | Admin |
| POST | `/api/matches/:id/result` | Submit match result | Admin |

---

## 🗄️ Database Schema

```
users ──────────────────────────────────────┐
  │                                          │
  ├── player_game_profiles (game profiles)   │
  ├── team_members ──── teams ──── games     │
  ├── team_invites                           │
  ├── tournament_registrations               │
  │         └── tournaments ── games         │
  └── player_stats                           │
            └── matches ── tournaments       │
                      └── match_results ─────┘
```

---

## 🔐 Authentication Flow

1. User logs in → server returns **access token** (30 min) + **refresh token** (7 days)
2. Frontend stores tokens in `localStorage`
3. Axios interceptor automatically attaches token to every request header
4. When access token expires → interceptor silently refreshes it using the refresh token
5. Logout → tokens cleared from storage

---

## ⚠️ Common Issues

| Issue | Fix |
|-------|-----|
| `pydantic-core` build error | Install Visual Studio C++ Build Tools with "Desktop development with C++" |
| Python 3.14 incompatibility | Install Python 3.12 specifically |
| bcrypt `__about__` error | `pip uninstall bcrypt -y && pip install bcrypt==4.0.1` |
| MySQL connection refused | Start MySQL service (Windows: `Start-Service -Name MySQL97`) |
| `source` not recognized | On Windows use `venv\Scripts\activate` instead |

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Author

Built by Md Safaet — [GitHub](https://github.com/safaetX)
