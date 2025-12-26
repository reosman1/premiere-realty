# Database Connection Fix

## Issue
The sync is failing because it can't connect to the Supabase database.

## Error Message
```
Can't reach database server at `db.zoklvsozvkbizepxkswl.supabase.co:5432`
```

## Solutions

### Option 1: Check DATABASE_URL in .env

Make sure your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres.zoklvsozvkbizepxkswl:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.zoklvsozvkbizepxkswl:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual Supabase password
- URL-encode special characters in password (e.g., `!` becomes `%21`)
- Use port `6543` for DATABASE_URL (connection pooler)
- Use port `5432` for DIRECT_URL (direct connection)

### Option 2: Get Fresh Connection String from Supabase

1. Go to your Supabase dashboard
2. Navigate to: **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** format
5. Copy the connection string
6. Update your `.env` file

### Option 3: Test Connection

Run this to test your database connection:
```bash
node check-db.js
```

### Option 4: Verify Supabase Project is Active

- Make sure your Supabase project is not paused
- Check if you've hit any connection limits
- Verify the project region matches the connection string

## After Fixing

1. Restart the dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. Try the sync again at `/admin/rezen-sync`

## Common Issues

### Password with Special Characters
If your password has special characters like `!`, `@`, `#`, etc., you need to URL-encode them:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- etc.

### Wrong Port
- **DATABASE_URL** should use port **6543** (connection pooler)
- **DIRECT_URL** should use port **5432** (direct connection)

### Connection Pooler vs Direct
- Use connection pooler (port 6543) for regular queries
- Use direct connection (port 5432) for migrations


