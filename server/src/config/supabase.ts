import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-local-dev.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'placeholder-key-for-local-development';

if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY)) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY are not defined. Using placeholder values for local development.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
