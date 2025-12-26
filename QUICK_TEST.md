# Quick Test Guide

## Step 1: Set Environment Variables

Add these to your `.env` file (create it if it doesn't exist):

```env
REZEN_API_KEY=real_seJCg6lLf7kycvRRJqMAy0xkYB6JOxIDdE9B
REZEN_PARTICIPANT_ID=1ff98827-d8de-458c-800b-8d7dd47e6f9b
REZEN_API_BASE_URL=https://arrakis.therealbrokerage.com/api/v1
REZEN_TEAM_ID=cbc59bd7-7085-41b9-9bd1-2f9e5a01dd0a
```

**Note:** Replace the API key with your actual REZEN API key if different.

## Step 2: Restart Dev Server

After adding env vars, restart the dev server:
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 3: Test via Admin UI (Easiest)

1. Open browser: `http://localhost:3000/admin/rezen-sync`
2. Select today's date for both "Date From" and "Date To"
3. Click "Start Sync"
4. View results

## Step 4: Test via API (Alternative)

### Test Transaction Sync
```bash
curl 'http://localhost:3000/api/cron/rezen-sync?dateFrom=2024-12-24&dateTo=2024-12-24'
```

### Test Agent Sync
```bash
curl 'http://localhost:3000/api/cron/rezen-agents'
```

### Test Listing Sync
```bash
curl 'http://localhost:3000/api/cron/rezen-listings?group=open'
```

## Expected Response

Success:
```json
{
  "success": true,
  "total": 5,
  "created": 2,
  "updated": 3,
  "skipped": 0,
  "errors": [],
  "duration": "1234ms"
}
```

Error (if env vars missing):
```json
{
  "success": false,
  "error": "REZEN API key is required"
}
```

## Troubleshooting

**"REZEN API key is required"**
- Make sure `.env` file exists in project root
- Check that `REZEN_API_KEY` is set
- Restart dev server after adding env vars

**"Cannot connect to database"**
- Check `DATABASE_URL` is set correctly
- Run: `npx prisma db push --accept-data-loss`

**"404 Not Found"**
- Make sure dev server is running
- Check URL is correct

## Check Sync Logs

After running a sync, check the logs:
1. Go to `/admin/rezen-sync` and scroll to "Sync History"
2. Or query database: `SELECT * FROM "SyncLog" ORDER BY "createdAt" DESC LIMIT 5;`


