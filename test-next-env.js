// Simulate what Next.js does
process.env.DATABASE_URL = undefined;
process.env.DIRECT_URL = undefined;

require('dotenv').config();

console.log('After dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 60) + '...)' : 'NOT SET');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'SET (' + process.env.DIRECT_URL.substring(0, 60) + '...)' : 'NOT SET');
