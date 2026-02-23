import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (typeof window !== 'undefined') {
    if (!supabaseUrl || supabaseUrl === 'undefined') {
        console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined! Check your VPS .env file and REBUILD the app.");
    } else {
        console.log("Supabase Client initialized with URL:", supabaseUrl.substring(0, 15) + "...");
    }
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
