require('dotenv').config({ path: '.env' });
console.log('From .env:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 80) : 'NOT SET');

// Clear and load .env.local
delete require.cache[require.resolve('dotenv')];
process.env.DATABASE_URL = undefined;
process.env.DIRECT_URL = undefined;
require('dotenv').config({ path: '.env.local' });
console.log('\nFrom .env.local:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 80) : 'NOT SET');
