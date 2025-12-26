require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Try to query
    const count = await prisma.syncLog.count();
    console.log(`✅ Query successful! SyncLog count: ${count}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log('Error:', error.message);
    if (error.message.includes('db.zoklvsozvkbizepxkswl')) {
      console.log('\n⚠️  Prisma is using old connection string!');
      console.log('This suggests the Prisma client needs to be regenerated or the .env is not being read correctly.');
    }
    process.exit(1);
  }
}

test();
