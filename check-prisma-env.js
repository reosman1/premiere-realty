require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

// Create a new client and inspect what URL it's using
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Try to access the internal connection URL (this won't work but let's see the error)
console.log('Testing connection with current env vars...');
console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 60) + '...' : 'NOT SET');

prisma.$connect()
  .then(() => {
    console.log('✅ Connected!');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  });
