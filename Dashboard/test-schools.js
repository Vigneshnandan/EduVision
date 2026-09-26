require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Testing Schools Table Access...\n');

supabase
  .from('schools')
  .select('*')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error fetching schools:', error.message);
    } else {
      console.log('✅ Schools Table Connected Successfully!');
      console.log(`✅ Found ${data.length} schools\n`);
      if (data.length > 0) {
        console.log('Sample Schools:');
        data.forEach(school => {
          console.log(`  - ${school.school_name} (${school.school_code})`);
        });
      }
      console.log('\n🎉 Your app is ready to use!');
    }
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });
