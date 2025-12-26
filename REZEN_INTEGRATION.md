# REZEN Direct Integration Implementation

This document describes the direct REZEN API integration that replaces the Make scenario "CRITICAL - REZEN - MASTER DAILY DOWNLOAD".

## Overview

The integration directly connects to the REZEN API (arrakis.therealbrokerage.com) to sync transaction data daily, eliminating the need for Make as a middleman.

## Components

### 1. REZEN API Client (`src/lib/rezen-api.ts`)
- TypeScript client for REZEN API
- Handles authentication with API key
- Methods:
  - `getOpenTransactions()` - Fetch transactions with filters
  - `getTransactionDetails()` - Get full transaction data
  - `getCommissionSplits()` - Get commission split information

### 2. State Mapper (`src/lib/utils/rezen-state-mapper.ts`)
- Maps REZEN lifecycle states to CRM transaction stages
- Handles all state transitions (NEW, SETTLED, TERMINATED, etc.)

### 3. Transaction Sync Service (`src/lib/services/transaction-sync.ts`)
- Core sync logic for processing REZEN transactions
- Handles upsert operations (create or update)
- Maps all REZEN fields to CRM database fields
- Manages transaction participants and commission splits

### 4. Scheduled Cron Job (`src/app/api/cron/rezen-sync/route.ts`)
- Daily sync endpoint (runs at 2 AM UTC via Vercel Cron)
- Can be triggered manually via GET/POST requests
- Supports custom date ranges for testing
- Logs all sync operations

### 5. Admin UI (`src/app/admin/rezen-sync/page.tsx`)
- Manual sync trigger interface
- View sync history and results
- Filter by date range
- Monitor sync status and errors

### 6. Enhanced Transaction Schema
- Added REZEN-specific fields:
  - `rezenId` (unique identifier)
  - `lifecycleState` (REZEN state)
  - `transactionCode`
  - Commission fields (grossCommissionAmount, agentSplitPercent, etc.)
  - QuickBooks integration fields
  - Address fields from REZEN
  - CD Payer information

## Environment Variables

Add these to your `.env` file and Vercel environment variables:

```env
REZEN_API_KEY=your_api_key_here
REZEN_PARTICIPANT_ID=1ff98827-d8de-458c-800b-8d7dd47e6f9b
REZEN_API_BASE_URL=https://arrakis.therealbrokerage.com/api/v1
CRON_SECRET=your_cron_secret_here  # Optional, for securing cron endpoints
```

## Database Migration

Run the Prisma migration to add the new fields:

```bash
npx prisma migrate dev --name add_rezen_transaction_fields
```

Or if you prefer to push directly (development only):

```bash
npx prisma db push --accept-data-loss
```

**Note:** The `--accept-data-loss` flag is needed because we're adding a unique constraint on `rezenId`. Since this is a new field, there should be no data loss.

## Usage

### Manual Sync

1. Navigate to `/admin/rezen-sync` in the application
2. Select date range (defaults to today)
3. Click "Start Sync"
4. View results and sync history

### Scheduled Sync

The sync runs automatically daily at 2 AM UTC via Vercel Cron (configured in `vercel.json`).

### API Endpoints

- `GET /api/cron/rezen-sync?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` - Manual trigger
- `POST /api/cron/rezen-sync` - Cron job endpoint (requires CRON_SECRET)
- `GET /api/admin/sync-logs?source=REZEN&entityType=transaction` - Fetch sync logs

## Field Mappings

The sync service maps REZEN transaction data to CRM fields:

- **Transaction Info**: ID, code, type, stage, status
- **Commission**: Gross commission, agent splits, broker fees
- **Dates**: Contract acceptance, estimated/actual closing dates
- **Address**: Full address breakdown from REZEN
- **Participants**: Agents, commission splits
- **QuickBooks**: QB IDs and invoice links (if synced)

## Benefits

1. **No Make Dependency**: Direct API integration
2. **Better Performance**: No external service delays
3. **Cost Savings**: No Make subscription needed
4. **Better Control**: Direct error handling and retry logic
5. **Real-time Ready**: Can add webhooks for instant updates
6. **Data Ownership**: All data stored in your CRM database

## Next Steps

1. Add environment variables to Vercel
2. Run database migration
3. Test manual sync via admin UI
4. Verify scheduled cron job is running
5. Monitor sync logs for any issues
6. Once validated, disable the Make scenario

## Troubleshooting

- **API Errors**: Check REZEN_API_KEY and REZEN_PARTICIPANT_ID
- **Sync Failures**: Check sync logs in admin UI or database
- **Missing Data**: Verify field mappings match REZEN API response structure
- **Cron Not Running**: Check Vercel cron configuration and CRON_SECRET

