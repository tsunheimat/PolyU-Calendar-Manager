
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

export const config = {
    runtime: 'edge',
};

// CORS Headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, x-api-key, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// --- ICS Generation Helpers ---

const formatICSDateUTC = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const formatICSDateHK = (d: Date): string => {
    const hkTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
    return hkTime.toISOString().replace(/[-:]/g, '').split('.')[0];
};

const escapeICSValue = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
};

const generateICSFile = (events: any[]): string => {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//UniCal Manager//EN\r\n';

    events.forEach(event => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);

        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${event.uid}\r\n`;
        ics += `DTSTAMP:${formatICSDateUTC(new Date())}\r\n`;
        ics += `DTSTART;TZID=Asia/Hong_Kong:${formatICSDateHK(start)}\r\n`;
        ics += `DTEND;TZID=Asia/Hong_Kong:${formatICSDateHK(end)}\r\n`;
        ics += `SUMMARY:${escapeICSValue(event.summary)}\r\n`;
        if (event.location) ics += `LOCATION:${escapeICSValue(event.location)}\r\n`;
        if (event.description) ics += `DESCRIPTION:${escapeICSValue(event.description)}\r\n`;
        ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR';
    return ics;
};

// --- Main Handler ---

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Setup Env Vars
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        // Anon key is optional if we fall back to Service Role for everything, but good to have.
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.VITE_SUPABASE_JWT_SECRET;

        // We ABSOLUTELY need URL and Service Key (for API Key lookup at least)
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Server configuration error: Missing Supabase credentials (URL or Service Role Key).');
        }

        let userJwt: string | null = null;
        let userId: string | null = null;
        let shouldUseRLS = false;

        // Admin client for key lookup (and fallback operations)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        let supabaseClient = adminClient; // Default to admin, override if we can impersonate

        // 2. Authentication Strategy
        const authHeader = req.headers.get('Authorization');
        const apiKey = req.headers.get('x-api-key');

        if (authHeader) {
            // Strategy A: Standard Supabase Session
            userJwt = authHeader.replace('Bearer ', '');
            shouldUseRLS = true;

            // If we have an Anon key, we can try to use RLS client
            if (supabaseAnonKey) {
                supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
                    global: { headers: { Authorization: `Bearer ${userJwt}` } }
                });
            } else {
                // If we don't have Anon Key, proceed with whatever client default or fail later if rights missing
                // Relying on RLS with service role is dangerous if we don't mint token, 
                // but if this is user supplied token, we can't use service role easily to "become" them without createClient(url, key, { auth: { token } })
                // actually we can do createClient(url, anon_key, { ... }) 
                // If anon key missing, we might struggle.
            }

            // Retrieve User ID for explicit checks if needed
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error || !user) throw new Error('Invalid User Token');
            userId = user.id;

        } else if (apiKey) {
            // Strategy B: API Key Impersonation

            // 2a. Verify Key using Service Role
            const { data: keyData, error: keyError } = await adminClient
                .from('api_keys')
                .select('user_id')
                .eq('key_value', apiKey)
                .single();

            if (keyError || !keyData) {
                return new Response(JSON.stringify({ error: 'Invalid API Key' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            userId = keyData.user_id;

            // 2b. Try to Mint JWT (Preferred)
            if (jwtSecret) {
                const secret = new TextEncoder().encode(jwtSecret);
                userJwt = await new SignJWT({
                    sub: userId,
                    role: 'authenticated',
                    aud: 'authenticated',
                    app_metadata: { provider: 'email' },
                    user_metadata: {}
                })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('1m')
                    .sign(secret);

                if (supabaseAnonKey) {
                    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
                        global: { headers: { Authorization: `Bearer ${userJwt}` } }
                    });
                    shouldUseRLS = true;
                }
            } else {
                // Fallback: No Secret -> Use Service Role + Explicit Filtering
                console.warn("SUPABASE_JWT_SECRET missing. Falling back to Service Role client with manual filtering.");
                supabaseClient = adminClient;
                shouldUseRLS = false;
            }

        } else {
            return new Response(JSON.stringify({ error: 'Missing Authorization header or x-api-key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Parse Body
        let body;
        try {
            body = await req.json();
        } catch {
            throw new Error("Invalid JSON body");
        }
        const { action, event, id, query } = body;

        // 4. Perform Action
        let result = {};
        let shouldSync = false;

        if (action === 'search') {
            let dbQuery = supabaseClient
                .from('events')
                .select('*')
                .is('deleted_at', null);

            // CRITICAL: If not using RLS (Service Role), we MUST filter manually
            if (!shouldUseRLS && userId) {
                dbQuery = dbQuery.eq('user_id', userId);
            }

            if (query) {
                dbQuery = dbQuery.ilike('summary', `%${query}%`);
            }

            const { data, error } = await dbQuery.limit(50);
            if (error) throw error;
            result = { events: data };

        } else if (action === 'create') {
            if (!event || !event.summary || !event.start) {
                throw new Error('Missing event details (summary, start)');
            }

            if (event.end && new Date(event.end) <= new Date(event.start)) {
                throw new Error('End time must be after start time');
            }

            const newEvent = {
                id: crypto.randomUUID(),
                user_id: userId, // Explicit is always safe
                uid: crypto.randomUUID(),
                summary: event.summary,
                description: event.description || '',
                location: event.location || '',
                start_time: event.start,
                end_time: event.end || new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString(),
                is_manual: true,
                deleted_at: null
            };

            const { data, error } = await supabaseClient.from('events').insert([newEvent]).select();
            if (error) throw error;

            result = { success: true, event: data[0] };
            shouldSync = true;

        } else if (action === 'delete') {
            if (!id) throw new Error('Missing event id');

            let dbQuery = supabaseClient
                .from('events')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            // CRITICAL: If not using RLS, filter by user_id
            if (!shouldUseRLS && userId) {
                dbQuery = dbQuery.eq('user_id', userId);
            }

            const { error } = await dbQuery;
            if (error) throw error;
            result = { success: true, message: 'Event deleted' };
            shouldSync = true;

        } else if (action === 'get_subjects') {
            let dbQuery = supabaseClient
                .from('events')
                .select('summary')
                .is('deleted_at', null);

            if (!shouldUseRLS && userId) {
                dbQuery = dbQuery.eq('user_id', userId);
            }

            const { data, error } = await dbQuery;
            if (error) throw error;

            // Extract unique summaries
            const subjects = Array.from(new Set(data.map((e: any) => e.summary))).filter(Boolean).sort();
            result = { subjects };

        } else {
            throw new Error('Invalid action. Supported actions: create, delete, search, get_subjects.');
        }

        // 5. Automatic Synchronization (Background)
        if (shouldSync && userId) {
            // 1. Get filename
            // Note: If using Service Role, this works. If using RLS, RLS must enable read on user_calendars.
            let calQuery = supabaseClient
                .from('user_calendars')
                .select('filename');

            // Manual filter if needed, though usually RLS on user_calendars is strict too
            if (!shouldUseRLS) {
                calQuery = calQuery.eq('user_id', userId);
            } else {
                // If RLS, user_id is inferred, but explicit doesn't hurt if policies allow
                calQuery = calQuery.eq('user_id', userId);
            }

            const { data: calData } = await calQuery.single();

            if (calData?.filename) {
                // 2. Fetch all active events
                let allEventsQuery = supabaseClient
                    .from('events')
                    .select('*')
                    .is('deleted_at', null);

                if (!shouldUseRLS) {
                    allEventsQuery = allEventsQuery.eq('user_id', userId);
                }

                const { data: allEvents } = await allEventsQuery;

                if (allEvents) {
                    const icsContent = generateICSFile(allEvents);

                    // 3. Upload to Storage
                    // Storage RLS can be tricky. Admin client always bypasses. 
                    // Authenticated user needs policies.
                    // To be safe/reliable, we can ALWAYS use adminClient for the storage upload since backend logic controls it.
                    // This avoids complex bucket RLS policies for "update".
                    const { error: uploadError } = await adminClient.storage
                        .from('calendars')
                        .upload(calData.filename, icsContent, {
                            contentType: 'text/calendar',
                            upsert: true,
                            cacheControl: '60'
                        });

                    if (uploadError) {
                        console.error("Background Sync failed:", uploadError);
                    } else {
                        // @ts-ignore
                        result.synced = true;
                    }
                }
            }
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error("API Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}