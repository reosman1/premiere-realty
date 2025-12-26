# Testing Guide for REZEN Sync

This guide will help you test the REZEN sync functionality.

## Prerequisites

1. **Environment Variables** - Make sure these are set in your `.env` file:
   ```env
   REZEN_API_KEY=your_api_key_here
   REZEN_PARTICIPANT_ID=1ff98827-d8de-458c-800b-8d7dd47e6f9b
   REZEN_API_BASE_URL=https://arrakis.therealbrokerage.com/api/v1
   REZEN_TEAM_ID=cbc59bd7-7085-41b9-9bd1-2f9e5a01dd0a
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_database_url
   ```

2. **Database Migration** - Run the migration if you haven't:
   ```bash
   npx prisma db push --accept-data-loss
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

## Testing Methods

### Method 1: Admin UI (Recommended)

1. Navigate to `http://localhost:3000/admin/rezen-sync`
2. Select a date range (start with a small range like today)
3. Click "Start Sync"
4. View results and sync history

### Method 2: API Endpoints (Direct)

Test individual endpoints using curl or Postman:

#### Test Transaction Sync
```bash
curl http://localhost:3000/api/cron/rezen-sync?dateFrom=2024-12-24&dateTo=2024-12-24
```

#### Test Agent Sync
```bash
curl http://localhost:3000/api/cron/rezen-agents
```

#### Test Listing Sync (Open)
```bash
curl http://localhost:3000/api/cron/rezen-listings?group=open
```

#### Test Pending Transactions
```bash
curl http://localhost:3000/api/cron/rezen-pending
```

### Method 3: Test Script

Run the automated test script:
```bash
node test-sync.js
```

## Expected Results

### Successful Sync Response
```json
{
  "success": true,
  "total": 10,
  "created": 5,
  "updated": 4,
  "skipped": 1,
  "errors": [],
  "duration": "1234ms",
  "dateFrom": "2024-12-24",
  "dateTo": "2024-12-24"
}
```

### Error Response
```json
{
  "success": false,
  "error": "REZEN API key is required"
}
```

## Troubleshooting

### Error: "REZEN API key is required"
- Check that `REZEN_API_KEY` is set in `.env`
- Restart the dev server after adding env vars

### Error: "REZEN Participant ID is required"
- Check that `REZEN_PARTICIPANT_ID` is set in `.env`

### Error: Database connection issues
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Run `npx prisma db push` to ensure schema is up to date

### No data synced
- Check REZEN API credentials are valid
- Verify the date range has data in REZEN
- Check sync logs in admin UI or database

### Check Sync Logs
Query the database to see sync history:
```sql
SELECT * FROM "SyncLog" 
WHERE source = 'REZEN' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

Or use the admin UI at `/admin/rezen-sync` to view sync history.

## Testing Checklist

- [ ] Environment variables set
- [ ] Database migration run
- [ ] Dev server running
- [ ] Test transaction sync (small date range)
- [ ] Test agent sync
- [ ] Test listing sync
- [ ] Check sync logs
- [ ] Verify data in database
- [ ] Test admin UI

## Next Steps After Testing

1. If all tests pass, you can:
   - Set up Vercel cron jobs (already configured in `vercel.json`)
   - Disable Make scenarios
   - Monitor syncs via admin UI

2. If tests fail:
   - Check error messages
   - Verify API credentials
   - Check database connection
   - Review sync logs


