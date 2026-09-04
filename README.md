# Portfolio

A modern, full-stack portfolio website built with Next.js 16, React 19, Tailwind CSS 4, and MongoDB. Features an admin panel, WebSocket support, web push notifications, and a contact form with email integration.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** React 19
- **Styling:** Tailwind CSS 4
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jose) + bcryptjs
- **Animations:** GSAP
- **Email:** Nodemailer (SMTP)
- **Web Push:** web-push (VAPID)
- **WebSocket:** ws
- **Forms:** React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Setup

```bash
git clone https://github.com/maazulhaque26-ship-it/portfolio.git
cd portfolio
npm install
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# Seed the admin account
npm run seed
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | JWT signing secret (48-byte base64) |
| `ADMIN_EMAIL` | Initial admin email |
| `ADMIN_PASSWORD` | Initial admin password |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key (server only) |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `EMAIL_FROM` | Sender email address (must be on a verified Resend domain for production) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with custom server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run seed` | Seed initial admin account |

## License

MIT
