# Pinnacle Tuition Classes — Coaching ERP + LMS

A production-oriented MERN application for a coaching institute: a public marketing/admissions website plus an internal Admin + Student portal covering admissions, courses, study material, assignments, attendance, online tests, fee payments (Razorpay), announcements, and real-time notifications.

This README covers architecture, setup, environment variables, and deployment. See `docs/API_CONTRACT.md` for the full REST API reference, `docs/DB_SCHEMA.md` for the MongoDB schema, and `docs/DESIGN_SYSTEM.md` for the UI design tokens.

## Tech stack

Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Chart.js/Recharts, Framer Motion, React Icons, Socket.IO client.
Backend: Node.js, Express, MongoDB/Mongoose, JWT (access + refresh), Cloudinary, Razorpay, Nodemailer, Socket.IO.
Deployment: Docker, Docker Compose, Nginx, PM2.

## Monorepo layout

```
pinnacle/
├── backend/            Express API (controllers, models, routes, middlewares, services, validators, utils, config, sockets)
├── frontend/            React app (components, pages, layouts, hooks, services, context)
├── deployment/
│   ├── nginx/nginx.conf     reverse proxy + SPA config
│   └── pm2/ecosystem.config.js  bare-metal process manager config
├── docs/                 API contract, DB schema, design system reference
└── docker-compose.yml
```

## Local development setup

Prerequisites: Node.js 18+, MongoDB 7 running locally (or use `docker compose up mongo`), a Cloudinary account, a Razorpay test account, an SMTP account (e.g. Gmail app password) for email — or leave the placeholder values below and skip the features that need them (registration/uploads/payments/emails simply won't work end-to-end until real keys are added; everything else runs fine).

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in Mongo URI, JWT secrets, Cloudinary/Razorpay/SMTP keys
npm install
npm run seed                # creates the admin user + 8 courses
npm run dev                 # http://localhost:5003

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Default seeded admin login uses `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `backend/.env`.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Notable ones:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — use long random strings in production (e.g. `openssl rand -hex 32`), never reuse the example values.
- `CLOUDINARY_*` — used for all file uploads (student documents, study material, assignment files, receipts).
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — use Razorpay **test mode** keys until you're ready to go live; the payment verification logic checks the HMAC signature Razorpay sends back, so test and live modes work identically from the app's perspective.
- `SMTP_*` — used for admission approval emails and password reset.
- `VITE_API_URL` / `VITE_SOCKET_URL` — where the frontend reaches the backend.

## Courses seeded out of the box

Class 10: Mathematics, Science, English, Hindi, Social Science, Computer.
Class 11: Physics. Class 12: Physics.
Add more via the Admin → Courses screen or the `/api/v1/courses` endpoint.

## Roles

Implemented now: `admin`, `student`. The `User` model also reserves `teacher`, `parent`, `receptionist` enum values so those roles can be added later without a schema migration — no UI/routes exist for them yet (see Roadmap).

## Security features implemented

JWT access + rotating refresh tokens (httpOnly cookie), bcrypt password hashing, role-based route authorization, Helmet security headers, CORS restricted to `CLIENT_URL` with credentials, rate limiting, `express-mongo-sanitize` + `hpp` + `xss-clean` against injection/pollution/XSS, centralized validation via `express-validator` on every mutating route, activity/audit logging on security-sensitive actions, scoped file upload validation (mimetype/size limits) before anything reaches Cloudinary.

## Deployment

### Docker Compose (recommended for a quick full-stack spin-up)

```bash
cp backend/.env.example backend/.env   # fill in real values first
docker compose up --build
```

This starts the backend API (port 5003, using your existing MongoDB Atlas connection from `backend/.env`), and Nginx serving the built frontend + reverse-proxying `/api` and `/socket.io` to the backend (port 80).

### Bare-metal / VM (Nginx + PM2)

```bash
# Backend
cd backend && npm ci --omit=dev
pm2 start ../deployment/pm2/ecosystem.config.js --env production
pm2 save && pm2 startup

# Frontend
cd frontend && npm ci && npm run build
# Copy frontend/dist/* to your Nginx web root, or point nginx.conf's `root` at it directly.
# Use deployment/nginx/nginx.conf as your server block (adjust `upstream` to 127.0.0.1:5003).
```

### Scaling notes (target: 1,000–2,000 active students)

- The backend is stateless aside from Socket.IO room membership, so it scales horizontally behind Nginx/a load balancer. PM2's cluster mode (`instances: "max"` in `ecosystem.config.js`) already uses all CPU cores on one box.
- **Socket.IO across multiple instances/processes** needs a shared adapter (`@socket.io/redis-adapter`) so a notification emitted from one process reaches a socket connected to another. Not required for a single-instance/PM2-fork deployment, but add it before running more than one backend process behind a load balancer.
- MongoDB: indexes are defined per `docs/DB_SCHEMA.md` on the highest-traffic query patterns (admission status/course/class filters, attendance per-student-per-date, notifications per-user-unread). Add a replica set once write volume from attendance/payments grows.
- All list endpoints are paginated; the frontend uses debounced search and route-level code splitting (`React.lazy`) to keep bundle size and re-render cost down.
- Cloudinary and Razorpay are both external managed services, so they scale independently of the app servers.

## Roadmap / future features (not built yet, by design — see the scoping note below)

Teacher dashboard, Parent dashboard, mobile app, AI chatbot / AI doubt solver, AI attendance prediction, WhatsApp/SMS notifications, Zoom/Google Meet integration, live classes, recorded lecture streaming. The `User`/`Student`/`Course` schemas already have the fields/enum values needed to build these without a breaking migration (e.g. `Course.teacher`, `User.role` enum).

## Scope note

This build focused on a genuinely complete, working core: auth + RBAC, the full admission-to-approval workflow, courses + study material, assignments + submissions + grading, attendance with aggregated reporting, an MCQ test engine with auto-grading/leaderboards, fee generation + Razorpay payments + PDF receipts, announcements + real-time Socket.IO notifications, messaging/support tickets, and admin analytics/exports — end to end, both API and UI, verified with a clean `npm run build` and backend syntax/boot checks. The items in the Roadmap section above were intentionally left as documented future work rather than built as non-functional stubs.
