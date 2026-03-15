# NeoConnect — Staff Feedback & Case Management Platform

A full-stack platform for transparent, accountable staff feedback management. Built for the NeoConnect Hackathon.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI primitives, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (stored in localStorage) |
| File Uploads | Multer |
| Cron Jobs | node-cron (escalation checks) |

---

## Project Structure

```
neoconnect/
├── backend/
│   ├── controllers/
│   │   └── caseController.js     # Escalation logic
│   ├── middleware/
│   │   ├── auth.js               # JWT protect + role guard
│   │   └── upload.js             # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Case.js
│   │   ├── Poll.js
│   │   └── HubItem.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── cases.js
│   │   ├── polls.js
│   │   ├── hub.js
│   │   └── analytics.js
│   ├── server.js
│   ├── seed.js                   # Creates admin + sample users
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── page.js               # Root redirect
    │   ├── login/page.js         # Staff + all-role login
    │   ├── register/page.js      # Staff-only registration
    │   └── dashboard/
    │       ├── layout.js         # Auth guard + Sidebar
    │       ├── page.js           # Dashboard home
    │       ├── submit/page.js    # Submit case form
    │       ├── cases/
    │       │   ├── page.js       # All cases (secretariat/admin)
    │       │   └── [id]/page.js  # Case detail + management
    │       ├── my-cases/page.js  # Staff & CM own cases
    │       ├── polls/page.js     # Polls + voting
    │       ├── hub/page.js       # Public hub
    │       ├── analytics/page.js # Analytics dashboard
    │       └── users/page.js     # Admin user management
    ├── components/
    │   ├── Sidebar.js
    │   └── Badges.js
    ├── lib/
    │   ├── api.js                # Axios instance
    │   ├── auth.js               # Auth context + hooks
    │   └── utils.js              # Helpers, color maps
    ├── .env.example
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- npm or yarn

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd neoconnect
```

---

### 2. Setup the Backend

```bash
cd backend
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neoconnect
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

**Seed the database** (creates admin + sample accounts):

```bash
npm run seed
```

This creates:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@neoconnect.com | Admin@NeoConnect123 |
| Secretariat | secretariat@neoconnect.com | Secretariat@123 |
| Case Manager | casemanager@neoconnect.com | CaseManager@123 |

**Start the backend:**

```bash
npm run dev     # development (with nodemon)
npm start       # production
```

Backend runs on: `http://localhost:5000`

---

### 3. Setup the Frontend

```bash
cd ../frontend
npm install
```

Copy and configure environment:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Start the frontend:**

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## User Roles & Access

| Role | Register | Login | Features |
|------|----------|-------|----------|
| **Staff** | ✅ Self-register | ✅ | Submit cases (incl. anonymous), view own cases, vote in polls, view hub |
| **Secretariat** | ❌ Admin creates | ✅ | All cases inbox, assign to case managers, create polls, publish hub content, analytics |
| **Case Manager** | ❌ Admin creates | ✅ | View assigned cases, update status, add notes, close cases |
| **Admin** | ❌ Seeded only | ✅ | All of the above + full user management (create/edit/delete all roles) |

> **Note:** Admin accounts cannot be created through the UI. They must be seeded via `npm run seed` or inserted directly into MongoDB.

---

## Features

### Case Lifecycle
```
New → Assigned → In Progress → Pending → Resolved
                                    ↘ Escalated (7 working days without response)
```

### Escalation
- A cron job runs every weekday at 9am
- If a case manager hasn't responded within 7 working days, the case is auto-escalated to `Escalated` status
- Weekends are excluded from the count

### Tracking IDs
Every case gets a unique ID in the format `NEO-YYYY-NNN` (e.g. `NEO-2024-001`)

### Anonymous Submissions
Staff can toggle anonymity — their name will not be stored with the case

### File Attachments
- Case submissions support up to 5 file attachments (images or PDFs, max 10MB each)
- Meeting minutes support PDF upload (max 20MB)

### Analytics (Secretariat + Admin)
- Cases by status, category, department, severity
- Monthly trend chart
- **Hotspot detection**: flags any department+category combination with 5+ open cases

### Public Hub
- Quarterly Digest posts
- Impact tracking table (raised → action → changed)
- Searchable meeting minutes archive

---

## API Routes

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Staff self-registration |
| POST | `/api/auth/login` | Public | All roles login |
| GET | `/api/auth/me` | Protected | Get current user |

### Cases
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/cases` | All authenticated | Submit case |
| GET | `/api/cases` | Role-filtered | List cases |
| GET | `/api/cases/:id` | Role-filtered | Case detail |
| PUT | `/api/cases/:id/assign` | Secretariat, Admin | Assign case manager |
| PUT | `/api/cases/:id/status` | CM, Secretariat, Admin | Update status |
| POST | `/api/cases/:id/notes` | CM, Secretariat, Admin | Add note |

### Users (Admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create secretariat/CM |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Polls, Hub, Analytics — see `/backend/routes/` for full documentation

---

## Environment Variables

### Backend (`.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry (default: `7d`) |
| `NODE_ENV` | `development` or `production` |

### Frontend (`.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Security Notes
- Passwords are hashed with bcrypt (12 rounds)
- All API routes check JWT and enforce role-based access
- Admin accounts cannot be created via the public API
- File uploads are validated by type and size

---

Built for NeoConnect Hackathon · Full Stack · 4 Hours
