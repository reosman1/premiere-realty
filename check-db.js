require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('   Error:', error.message);
    console.log('\n💡 Check your DATABASE_URL in .env file');
    console.log('   It should look like:');
    console.log('   postgresql://postgres:password@host:port/database');
    process.exit(1);
  }
}

testConnection();
