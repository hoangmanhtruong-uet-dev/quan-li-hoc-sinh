import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ozcrgunjhddtyybddohj.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "sb_publishable_GJ-q5nttC5Us3rQZvXWeoA_OI-lCRmp";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
