-- =================================================================
-- Schema for Events
-- =================================================================
DROP TABLE IF EXISTS public.events;

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key with auto-generated UUID.
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(), -- Foreign key to the user who owns the event.
  uid TEXT NOT NULL, -- Unique identifier from the original ICS file.
  summary TEXT,
  location TEXT,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_manual BOOLEAN DEFAULT false,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL -- Timestamp for soft deletion.
);

-- RLS Policies for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);


-- =================================================================
-- Schema for User Calendars
-- =================================================================
DROP TABLE IF EXISTS public.user_calendars;

CREATE TABLE public.user_calendars (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for user_calendars
ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendar record" 
ON public.user_calendars 
FOR ALL 
USING (auth.uid() = user_id);


-- =================================================================
-- Schema for API Keys
-- =================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  label TEXT DEFAULT 'n8n Key',
  key_value TEXT NOT NULL UNIQUE, -- The secret API key value.
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Grant service_role access to bypass RLS for key validation.
GRANT ALL ON api_keys TO service_role;


-- =================================================================
-- Storage Bucket Setup ('calendars')
-- =================================================================
-- Create 'calendars' bucket if it doesn't exist and set it to public.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('calendars', 'calendars', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- Ensure the bucket is public (idempotent update).
UPDATE storage.buckets
SET public = true WHERE id = 'calendars';


-- Policy: Allow authenticated users to view their own files.
DROP POLICY IF EXISTS "Authenticated users can select own objects" ON storage.objects;
CREATE POLICY "Authenticated users can select own objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid())::text);

-- Policy: Allow authenticated users to upload files to the 'calendars' bucket.
DROP POLICY IF EXISTS "Authenticated user upload access" ON storage.objects;
CREATE POLICY "Authenticated user upload access" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'calendars' AND owner_id = (SELECT auth.uid())::text);

-- Policy: Allow authenticated users to update their own files.
DROP POLICY IF EXISTS "Authenticated user update access" ON storage.objects;
CREATE POLICY "Authenticated user update access" ON storage.objects
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'calendars' AND owner_id = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'calendars' AND owner_id = (SELECT auth.uid())::text);

-- Policy: Allow authenticated users to delete their own files.
DROP POLICY IF EXISTS "Authenticated user delete access" ON storage.objects;
CREATE POLICY "Authenticated user delete access" ON storage.objects
  FOR DELETE TO authenticated 
  USING (bucket_id = 'calendars' AND owner_id = (SELECT auth.uid())::text);
