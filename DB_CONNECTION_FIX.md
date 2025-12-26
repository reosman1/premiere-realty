# Database Connection Fix

## Issue
Prisma is trying to connect to the wrong database host/port.

Error: `Can't reach database server at db.zoklvsozvkbizepxkswl.supabase.co:5432`

## Root Cause
The Prisma client was generated with old connection strings. It needs to be regenerated after updating the DATABASE_URL.

## Solution

1. **Verify your .env file has the correct format:**
   ```env
   DATABASE_URL="postgresql://postgres.zoklvsozvkbizepxkswl:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.zoklvsozvkbizepxkswl:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
   ```

2. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## Important Notes

- **DATABASE_URL** should use the **pooler** hostname: `aws-0-us-west-2.pooler.supabase.com:6543`
- **DIRECT_URL** should use the **direct** hostname: `aws-0-us-west-2.pooler.supabase.com:5432`
- After changing `.env`, always run `npx prisma generate` to regenerate the client
- Always restart the dev server after changing environment variables

## Connection String Format

Your connection strings should look like this:
```
DATABASE_URL="postgresql://postgres.XXXXX:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.XXXXX:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

Replace:
- `XXXXX` with your actual project ID
- `password` with your actual password (URL-encoded if needed)
- Port `6543` for pooler (DATABASE_URL)
- Port `5432` for direct (DIRECT_URL)


