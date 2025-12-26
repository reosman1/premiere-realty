require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set (length: ' + process.env.DIRECT_URL.length + ')' : 'NOT SET');

// Check if using pooler
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  if (url.includes(':6543')) {
    console.log('✅ DATABASE_URL uses pooler port (6543)');
  } else if (url.includes(':5432')) {
    console.log('⚠️  DATABASE_URL uses direct port (5432) - should use 6543 for pooler');
  }
}
