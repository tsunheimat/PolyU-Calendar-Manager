
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno for TypeScript as it's globally available in the Supabase Edge Function environment
declare const Deno: any;

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-api-key, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate API Key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log(`Received API Key for validation: ${apiKey}`);

    // Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the user associated with this key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .single();

    if (keyError || !keyData) {
      console.error(`API Key validation failed. Key: "${apiKey}", DB Error:`, keyError);
      return new Response(JSON.stringify({ error: 'Invalid API Key' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = keyData.user_id;

    // 2. Parse Request Body
    const { action, event, query, id } = await req.json();

    // 3. Handle Actions
    if (action === 'search') {
      // Search active events (not deleted)
      let dbQuery = supabaseAdmin
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (query) {
        dbQuery = dbQuery.ilike('summary', `%${query}%`);
      }

      const { data, error } = await dbQuery.limit(50);
      if (error) throw error;
      return new Response(JSON.stringify({ events: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create') {
      if (!event || !event.summary || !event.start) {
        return new Response(JSON.stringify({ error: 'Missing event details (summary, start)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Default ID and Manual flag
      const newEvent = {
        id: crypto.randomUUID(),
        user_id: userId,
        uid: crypto.randomUUID(),
        summary: event.summary,
        description: event.description || '',
        location: event.location || '',
        start_time: event.start,
        end_time: event.end || new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString(),
        is_manual: true,
        deleted_at: null
      };

      const { data, error } = await supabaseAdmin.from('events').insert([newEvent]).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, event: data[0] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing event id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Soft Delete
      const { error } = await supabaseAdmin
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId); // Ensure user owns it

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Event soft deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use search, create, or delete.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});