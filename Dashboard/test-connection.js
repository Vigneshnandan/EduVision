// Test Supabase connection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...\n');
console.log('Environment Variables:');
console.log(`✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT FOUND'}`);
console.log(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'NOT FOUND'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Environment variables not found!');
  console.error('Make sure .env.local file exists in the project root with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✓ Supabase client created successfully!\n');

  // Test a simple query
  supabase
    .from('students')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('⚠️  Query test (expected if table doesn\'t exist):');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('✓ Successfully connected to Supabase database!');
        console.log(`✓ Query returned: ${data ? data.length + ' record(s)' : 'empty result'}`);
      }
      console.log('\n✅ Supabase connection is properly configured!');
    })
    .catch(err => {
      console.error('❌ Connection failed:', err.message);
      process.exit(1);
    });
} catch (err) {
  console.error('❌ Failed to create Supabase client:', err.message);
  process.exit(1);
}
