import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ozcrgunjhddtyybddohj.supabase.co';
const supabaseAnonKey = 'sb_publishable_GJ-q5nttC5Us3rQZvXWeoA_OI-lCRmp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("🔌 Testing Supabase connection to:", supabaseUrl);
  
  try {
    // Check students table
    const { data: students, error: studentErr } = await supabase.from('students').select('count', { count: 'exact' });
    
    if (studentErr) {
      console.log("❌ Table 'students' error:", studentErr.message);
      console.log("👉 Bạn cần chạy script SQL trong file supabase_schema.sql trên Supabase SQL Editor!");
    } else {
      console.log("✅ Table 'students' connected successfully! Current count:", students);
    }

    // Check class_sessions table
    const { data: sessions, error: sessionErr } = await supabase.from('class_sessions').select('count', { count: 'exact' });
    
    if (sessionErr) {
      console.log("❌ Table 'class_sessions' error:", sessionErr.message);
    } else {
      console.log("✅ Table 'class_sessions' connected successfully! Current count:", sessions);
    }

  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();
