# Gaming Tournament Management System

A production-grade, full-stack esports tournament web application engineered according to the official **DBMS Project Specification**. The platform eliminates spreadsheet confusion by providing an auditable, normalized 3NF relational database on MySQL 8.0 with automated integrity checks, role-based access control, and unified solo/team registrations.

---

## 🏆 Project Modules (Phase 1 Scope)

1. **Module 1 — User & Profile Management**
   - User registration, login, session JWT tokens, and bcrypt password hashing.
   - Profile inspection, updating details (country, email, password).
   - Role-Based Access Control (RBAC) separating **Players**, **Team Captains**, and **Administrators**.

2. **Module 2 — Game & Tournament Management**
   - Games catalog (`Games`) storing esports titles, platforms, publishers, and genres.
   - Tournament management (`Tournaments`) with formats (Single Elimination, Double Elimination, Round Robin), entry fees, participant capacity limits, and statuses (`Upcoming`, `Open`, `Ongoing`, `Completed`, `Cancelled`).
   - 1:1 Tournament Rules (`TournamentRules`) storing `participation_type` (Solo vs Team), `team_size`, `min_age`, `region_restriction`, and rulebooks.
   - Live tournament search and filtering.

3. **Module 3 — Team Management**
   - Squad creation assigning the creator as **Captain** atomically in `Teams` and `TeamMembers`.
   - Team roster tracking with composite key `(team_id, user_id)`.
   - Captain permissions: invite members, update roles (`Captain`, `Starter`, `Substitute`), remove members, or disband team.
   - Member capability to leave teams.

4. **Module 4 — Unified Registration Management**
   - Unified `Registrations` table for both individual players and teams.
   - Strict exclusive-arc constraint:
     ```sql
     CONSTRAINT chk_one_entrant CHECK ((user_id IS NULL) <> (team_id IS NULL))
     ```
   - Unique constraints preventing duplicate solo and team signups:
     ```sql
     UNIQUE(tournament_id, user_id);
     UNIQUE(tournament_id, team_id);
     ```
   - MySQL Triggers and transaction row locking enforcing registration deadlines, status validation, participation type matching, and maximum participant caps.
   - Lifecycle workflow: `Pending` ➔ `Approved`, `Rejected`, or `Cancelled`.
   - Audit integrity: cancelled entries are never physically deleted (`DELETE`); status transitions preserve full historical records.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, `mysql2/promise` (Connection Pooling & Transactions), bcryptjs, jsonwebtoken, cors, dotenv |
| **Database** | MySQL 8.0 Server (Normalized 3NF, Foreign Keys, Triggers, Check Constraints) |
| **Testing** | Jest, Supertest, ts-jest (24 integration test cases verified) |
| **DevOps** | Docker, Docker Compose, Git |

---

## 📊 Database Design & Relational Model

The system fully defines the **16 relational tables** from the DBMS project document:

- **Core Implemented Modules (1–4)**: `Users`, `Games`, `Tournaments`, `TournamentRules`, `Teams`, `TeamMembers`, `Registrations`.
- **Complete Schema (Modules 5–6 DDL Included)**: `Matches`, `MatchParticipants`, `MatchResults`, `Payments`, `Prizes`, `Sponsors`, `TournamentSponsors`, `MatchDisputes`, `ResultCorrections`.

### Key MySQL 8.0 Triggers
- `trg_before_insert_registration`: Validates tournament open status, ensures `CURRENT_TIMESTAMP <= registration_deadline`, asserts solo vs team matches `TournamentRules.participation_type`, and verifies registration capacity count `< max_participants`.
- `trg_before_update_registration`: Prevents mutating registrations into violating tournament rule types.
- `trg_before_insert_match_participant`: Verifies that participants assigned to a match belong to the match's host tournament.

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0 (running locally on port 3306 or via Docker)
- npm or pnpm

### 1. Clone & Setup Project
```bash
git clone https://github.com/StrangeQuark590/gaming-tournament-system.git
cd gaming-tournament-system
```

### 2. Configure Environment Variables
Create `.env` inside `backend/`:
```bash
cp .env.example backend/.env
```
Ensure your database credentials match your local MySQL 8.0 instance:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gaming_tournament_db
PORT=5000
JWT_SECRET=super_secret_gaming_tournament_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Initialize Database Schema & Seed Data
Execute the scripts using MySQL CLI or the provided npm runner:
```bash
cd backend
npm install
npm run db:init
npm run db:seed
```
*Alternatively, load the SQL files directly in MySQL Workbench:*
1. `database/01_schema.sql`
2. `database/02_triggers.sql`
3. `database/03_seed.sql`

### 4. Start Backend Server
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

### 5. Start Frontend Client
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# Frontend live on http://localhost:5173
```

---

## 🐳 Running with Docker Compose (One-Click)

Launch the entire stack (MySQL 8.0 container + Node.js backend + Nginx React frontend) with a single command:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:80`
- Backend API: `http://localhost:5000/api`
- MySQL Database: `localhost:3306`

---

## 🧪 Automated Testing

Run the automated integration tests against real MySQL tables:
```bash
cd backend
npm test
```
The test suite validates:
- **Module 1**: Player registration, duplicate rejection, login authentication, JWT verification, and RBAC admin-route blocking.
- **Module 2**: Game creation permissions, dates validation (`end_date >= start_date`), tournament and 1:1 rules insertion.
- **Module 3**: Team creation, automatic captain designation in `Teams` & `TeamMembers`, roster querying, captain-only member additions, duplicate member rejection.
- **Module 4**: Solo registration into solo events, rejection of solo entry into team tournaments, duplicate prevention (`UNIQUE`), team entry by captain, 403 rejection for non-captains, admin approval workflow, and cancellation history preservation.

---

## 🔑 Demo Evaluator Accounts

All seed user accounts use the default password: **`Password123!`**

| Username | Role | Persona / Capabilities |
|---|---|---|
| **`admin`** | Administrator | Full dashboard, create tournaments & games, approve/reject registrations |
| **`priyanshu`** | Administrator | Co-organizer admin account |
| **`shroud_jr`** | Team Captain | Captain of **Sentinels Elite**, manages roster, registers team in Valorant |
| **`s1mple_king`**| Team Captain | Captain of **NAVI Reborn**, manages roster, registers team in CS2 |
| **`faker_legend`**| Team Captain | Captain of **T1 Prodigies** |
| **`soloplayer1`** | Player (Solo) | Enters solo events (Tekken 8, Rocket League), views personal registrations |

*Pro Tip: The application UI features a **"Demo Switcher"** in the top navigation bar to switch between administrator and player personas with a single click!*

---

## 📁 Repository Structure

```
gaming-tournament-system/
├── backend/
│   ├── src/
│   │   ├── config/db.ts              # MySQL 8.0 connection pool & transaction helper
│   │   ├── controllers/              # Business logic for all 4 modules
│   │   ├── middleware/               # JWT auth, RBAC admin check, error handling
│   │   ├── routes/                   # RESTful API route declarations
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── db/                       # Programmatic DB migration & seed runners
│   │   ├── tests/                    # 24 Jest integration test cases
│   │   ├── app.ts                    # Express application configuration
│   │   └── server.ts                 # HTTP server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios API clients for auth, games, teams, etc.
│   │   ├── components/               # Navbar, Footer, TournamentCard, RegisterModal, etc.
│   │   ├── context/AuthContext.tsx   # React Authentication state & demo persona switcher
│   │   ├── pages/                    # Home, Tournaments, Teams, Profile, Login, Register
│   │   ├── pages/admin/              # Admin Dashboard, Tournaments, Games, Registrations
│   │   ├── App.tsx                   # React Router routing tree
│   │   └── main.tsx                  # Vite React entry point
│   ├── package.json
│   └── tailwind.config.js
├── database/
│   ├── 01_schema.sql                 # 16-table normalized DDL schema with constraints
│   ├── 02_triggers.sql               # Registration deadline & type cross-table triggers
│   └── 03_seed.sql                   # Realistic sample data & Section 13 query fixtures
├── docker-compose.yml                # Multi-container orchestration
├── Dockerfile.backend                # Multi-stage production Node.js container
├── Dockerfile.frontend               # Multi-stage Nginx React container
├── .env.example                      # Configuration template
└── README.md                         # Project documentation
```

---

## 🌐 Sample SQL Queries (Section 13)

The application implements the analytical queries documented in the specification:

1. **Tournaments open for registration**:
   ```sql
   SELECT t.tournament_id, t.title, g.game_name, t.entry_fee, t.registration_deadline
   FROM Tournaments t
   JOIN Games g ON g.game_id = t.game_id
   WHERE t.status = 'Open' AND t.registration_deadline >= CURDATE();
   ```

2. **Team roster and captain status**:
   ```sql
   SELECT t.team_name, u.username, tm.member_role, (u.user_id = t.captain_id) AS is_captain
   FROM Teams t
   JOIN TeamMembers tm ON tm.team_id = t.team_id
   JOIN Users u ON u.user_id = tm.user_id
   WHERE t.team_id = 1;
   ```

3. **Solo versus team registrations per tournament**:
   ```sql
   SELECT t.title,
          SUM(r.user_id IS NOT NULL) AS solo_entries,
          SUM(r.team_id IS NOT NULL) AS team_entries
   FROM Tournaments t
   JOIN Registrations r ON r.tournament_id = t.tournament_id
   WHERE r.status <> 'Cancelled'
   GROUP BY t.tournament_id, t.title;
   ```

---

## 🚀 Deployment Guide

### Deploying to Render / Railway
1. **Database**: Spin up a managed MySQL 8.0 instance on Railway, Aiven, or AWS RDS.
2. **Schema**: Run `database/01_schema.sql`, `02_triggers.sql`, and `03_seed.sql` against the managed database.
3. **Backend**:
   - Set Build Command: `npm install && npm run build`
   - Set Start Command: `npm start`
   - Provide environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `CLIENT_URL`).
4. **Frontend**:
   - Set Build Command: `npm install && npm run build`
   - Set Publish Directory: `dist`
   - Set `VITE_API_URL` to your live backend domain.

---

## 📝 Project Limitations & Future Roadmap

As specified in the project requirements:
- **Scope Boundary**: Match scheduling (rounds and brackets), match result tracking, payments, prizes, and dispute resolution belong to Phase 2 (Modules 5 & 6) and are planned for future extension.
- **Automatic Brackets**: Brackets are defined by organizers; algorithmic bracket tree auto-generation is slated for the match scheduling phase.
- **Payment Processing**: Payment records and schema are defined in `Payments`; live third-party payment gateway integration (Stripe / Razorpay) will be added with Module 6.

---

## 👥 Credits
Submitted for **Database Management System (DBMS)**:
- **Priyanshu** (2025UCS1582)
- **Dixsant Kumar** (2025UCS1612)
- **Ridham** (2025UCS1609)
- **Arpit Gahlawat** (2025UCS1623)
