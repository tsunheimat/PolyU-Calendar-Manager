import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get the User's JWT from the request headers
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Initialize Supabase Client with the USER'S token
    // We use the ANON key (public), but we explicitly set the Authorization header.
    // This tells Supabase: "I am this specific user."
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    // Fallback through common environment variable names for the Anon/Public key
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Server configuration error: Missing Supabase URL or Anon Key.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }, // Forward the Bearer token
      },
    });

    // 3. Perform DB operation
    // RLS policies (auth.uid() = user_id) are AUTOMATICALLY applied here.
    // You do NOT need to manually filter by user_id.
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
      .limit(100);

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}