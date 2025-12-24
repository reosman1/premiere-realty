# Premiere Realty CRM

A custom CRM built for Premiere Realty to manage real estate team operations, replacing Zoho CRM.

## Features

- 👥 **Team Management** - Onboarding, offboarding, commission splits, cap tracking
- 🏠 **Listings** - Property listings with MLS integration
- 📋 **Transactions** - Deal pipeline from contract to close
- 💰 **Commissions** - Track agent commissions and payouts
- 🔗 **Integrations** - REZEN, Make, QuickBooks webhooks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud like Supabase/Neon)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/premiere-realty.git
cd premiere-realty
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Webhook Endpoints

The CRM exposes these webhook endpoints for integration with Make and REZEN:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/rezen/agents` | POST | Sync agent data from REZEN |
| `/api/webhooks/rezen/listings` | POST | Sync listing data from REZEN |
| `/api/webhooks/rezen/transactions` | POST | Sync transaction data from REZEN |
| `/api/webhooks/make` | POST | Generic webhook for Make automations |

### Webhook Authentication

Add the header `x-webhook-secret` with your `WEBHOOK_SECRET` value to authenticate requests.

### Example Make Webhook Payload

```json
{
  "entityType": "agent",
  "action": "update",
  "data": {
    "rezenId": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
  }
}
```

## Database Schema

The CRM uses a PostgreSQL database with these main tables:

- `Agent` - Team members with commission splits and cap tracking
- `Listing` - Property listings with MLS data
- `Transaction` - Deals with commission calculations
- `CommissionPayment` - Agent commission payouts
- `SyncLog` - Integration sync history

Run `npx prisma studio` to explore the database.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database

We recommend [Supabase](https://supabase.com) or [Neon](https://neon.tech) for PostgreSQL hosting:

1. Create a new project
2. Copy the connection string
3. Add to `DATABASE_URL` in your environment

## Data Migration from Zoho

Migration scripts are located in `/scripts/migrate/`. To migrate data:

1. Export data from Zoho as CSV
2. Place files in `/zoho-exports/`
3. Run migration scripts:
```bash
npx ts-node scripts/migrate/agents.ts
npx ts-node scripts/migrate/listings.ts
npx ts-node scripts/migrate/transactions.ts
```

## License

Proprietary - Premiere Realty © 2024
