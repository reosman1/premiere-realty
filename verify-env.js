require('dotenv').config();
const dbUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';

console.log('\n📋 Environment Variables Check:\n');
console.log('DATABASE_URL:', dbUrl ? `Set (${dbUrl.length} chars)` : '❌ NOT SET');
console.log('DIRECT_URL:', directUrl ? `Set (${directUrl.length} chars)` : '❌ NOT SET');

if (dbUrl) {
  console.log('\n🔍 DATABASE_URL Analysis:');
  if (dbUrl.includes('pooler.supabase.com')) {
    console.log('✅ Uses pooler hostname');
  } else if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co')) {
    console.log('⚠️  Uses old format (db.XXX.supabase.co) - should use pooler');
  }
  
  if (dbUrl.includes(':6543')) {
    console.log('✅ Uses pooler port (6543)');
  } else if (dbUrl.includes(':5432')) {
    console.log('⚠️  Uses direct port (5432) - should use 6543 for pooler');
  }
  
  // Show first 50 chars (without password)
  const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log('Preview:', safeUrl.substring(0, 80) + '...');
}

if (directUrl) {
  console.log('\n🔍 DIRECT_URL Analysis:');
  if (directUrl.includes(':5432')) {
    console.log('✅ Uses direct port (5432)');
  }
}
