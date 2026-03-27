# Birdie for Good

Subscription-driven golf platform blending performance tracking, monthly draw rewards, and charity impact.

## Implemented Scope

- Subscription flow with monthly and yearly plans
- Stripe checkout and webhook endpoints (PCI-compliant provider integration path)
- JWT session auth with role-aware access control (subscriber/admin)
- Stableford score engine with strict 1-45 validation and rolling latest 5 logic
- Monthly draw engine
- Random and algorithmic draw modes
- Simulation mode and publish mode
- Tiered rewards for 5/4/3 matches
- Jackpot rollover for unclaimed 5-match tier
- Charity system
- Charity directory with search and featured spotlight
- Per-user charity selection and percentage contribution (minimum 10%)
- Winner verification
- Proof submission endpoint
- Admin review (approve/reject) and payout status updates
- User dashboard modules
- Admin dashboard modules (draw controls, users, subscriptions, charities, winners, analytics)
- Mobile-first responsive UI with motion and non-traditional golf styling

## Demo Credentials

- Subscriber: `demo@birdieforgood.com` / `Demo123!`
- Admin: `admin@birdieforgood.com` / `Admin123!`

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Zod for request validation
- JWT + bcryptjs for session auth
- Stripe SDK for payment integration
- Supabase schema provided in `supabase/schema.sql`

## Run Locally

1. Install packages

```bash
npm install
```

2. Create local env file

```bash
cp .env.example .env.local
```

3. Set env values in `.env.local`

- `JWT_SECRET`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

4. Start dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup (New Project Requirement)

1. Create a brand new Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Add project keys to `.env.local` and Vercel env variables.

## Vercel Deployment (New Account Requirement)

1. Create a new Vercel account or team for this project.
2. Import this repository.
3. Add all env variables from `.env.example`.
4. Deploy.

## Testing Checklist Mapping

- Signup/login: `/signup`, `/login`
- Subscription flow: `/dashboard` + `/api/payments/checkout`
- Score rolling logic: `/dashboard` + `/api/scores`
- Draw simulation/publish: `/admin` + `/api/draws`
- Charity selection/contribution: `/signup`, `/dashboard`, `/charities`
- Winner verification/payout: `/dashboard`, `/admin`, `/api/winners`
- User dashboard: `/dashboard`
- Admin dashboard: `/admin`

## Important Notes

- Current implementation uses an in-memory store for functional demo behavior.
- For production persistence, wire route handlers to Supabase tables defined in `supabase/schema.sql`.
- Stripe webhook handler includes structure for subscription-event processing; extend it to persist Stripe subscription IDs and lifecycle states.
