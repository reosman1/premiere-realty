require('dotenv').config();
const required = ['REZEN_API_KEY', 'REZEN_PARTICIPANT_ID', 'DATABASE_URL'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.log('❌ Missing environment variables:');
  missing.forEach(key => console.log(`   - ${key}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
  console.log(`   REZEN_API_KEY: ${process.env.REZEN_API_KEY ? 'Set' : 'Missing'}`);
  console.log(`   REZEN_PARTICIPANT_ID: ${process.env.REZEN_PARTICIPANT_ID || 'Missing'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
}
