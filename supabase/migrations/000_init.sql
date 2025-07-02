-- Initial database schema for PolitiRate

-- Drop existing policies and functions if they exist to avoid conflicts
-- Note: This is safe to run multiple times.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to view their own profile') THEN
    DROP POLICY "Allow users to view their own profile" ON public.users;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to update their own profile') THEN
    DROP POLICY "Allow users to update their own profile" ON public.users;
  END IF;
   IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow anyone to view approved leaders') THEN
    DROP POLICY "Allow anyone to view approved leaders" ON public.leaders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow authenticated users to add leaders') THEN
    DROP POLICY "Allow authenticated users to add leaders" ON public.leaders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to update leaders they submitted') THEN
    DROP POLICY "Allow users to update leaders they submitted" ON public.leaders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow anyone to view ratings') THEN
    DROP POLICY "Allow anyone to view ratings" ON public.ratings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to insert/update their own ratings') THEN
    DROP POLICY "Allow users to insert/update their own ratings" ON public.ratings;
  END IF;
   IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow admins to read all messages') THEN
    DROP POLICY "Allow admins to read all messages" ON public.admin_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to see their own messages') THEN
    DROP POLICY "Allow users to see their own messages" ON public.admin_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to update their own messages to read') THEN
    DROP POLICY "Allow users to update their own messages to read" ON public.admin_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow read access to everyone') THEN
    DROP POLICY "Allow read access to everyone" ON public.site_settings;
    DROP POLICY "Allow read access to everyone" ON public.notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow logged-in users to create tickets') THEN
    DROP POLICY "Allow logged-in users to create tickets" ON public.support_tickets;
  END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable read access for all users') THEN
    DROP POLICY "Enable read access for all users" ON public.polls;
    DROP POLICY "Enable read access for all users" ON public.poll_questions;
    DROP POLICY "Enable read access for all users" ON public.poll_options;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own responses') THEN
    DROP POLICY "Users can view their own responses" ON public.poll_responses;
  END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own responses') THEN
    DROP POLICY "Users can insert their own responses" ON public.poll_responses;
  END IF;
END $$;


-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    name text,
    gender text,
    age integer,
    state text,
    "mpConstituency" text,
    "mlaConstituency" text,
    panchayat text,
    "createdAt" timestamp with time zone DEFAULT now(),
    "isBlocked" boolean DEFAULT false,
    "blockedUntil" timestamp with time zone,
    "blockReason" text
);

CREATE TABLE IF NOT EXISTS public.leaders (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "partyName" text NOT NULL,
  gender text NOT NULL,
  age integer NOT NULL,
  "photoUrl" text,
  constituency text NOT NULL,
  "nativeAddress" text NOT NULL,
  "electionType" text NOT NULL,
  location jsonb,
  rating numeric DEFAULT 0,
  "reviewCount" integer DEFAULT 0,
  "previousElections" jsonb,
  "manifestoUrl" text,
  "twitterUrl" text,
  "addedByUserId" uuid REFERENCES public.users(id) ON DELETE SET NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text NOT NULL,
  "adminComment" text
);

CREATE TABLE IF NOT EXISTS public.ratings (
  "leaderId" uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  "socialBehaviour" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("leaderId", "userId")
);

CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  "isRead" boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id integer PRIMARY KEY,
    maintenance_active text,
    maintenance_start timestamp with time zone,
    maintenance_end timestamp with time zone,
    maintenance_message text,
    contact_email text,
    contact_phone text,
    contact_twitter text,
    contact_linkedin text,
    contact_youtube text,
    contact_facebook text
);
-- Ensure there's a settings row
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    link text
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    admin_notes text
);

CREATE TABLE IF NOT EXISTS public.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT false,
    active_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL,
    question_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    option_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (question_id, user_id)
);


-- 2. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;


-- 3. Create RLS Policies
-- Users
CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Leaders
CREATE POLICY "Allow anyone to view approved leaders" ON public.leaders FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow authenticated users to add leaders" ON public.leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update leaders they submitted" ON public.leaders FOR UPDATE USING (auth.uid() = "addedByUserId") WITH CHECK (auth.uid() = "addedByUserId");
-- Ratings
CREATE POLICY "Allow anyone to view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Allow users to insert/update their own ratings" ON public.ratings FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
-- Admin Messages
CREATE POLICY "Allow users to see their own messages" ON public.admin_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own messages to read" ON public.admin_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Site Settings & Notifications
CREATE POLICY "Allow read access to everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow read access to everyone" ON public.notifications FOR SELECT USING (true);
-- Support Tickets
CREATE POLICY "Allow logged-in users to create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Polls
CREATE POLICY "Enable read access for all users" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.poll_questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Users can view their own responses" ON public.poll_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own responses" ON public.poll_responses FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. Create Database Functions
-- These functions perform tasks that might require elevated permissions temporarily.
DROP FUNCTION IF EXISTS public.handle_new_rating;
CREATE OR REPLACE FUNCTION public.handle_new_rating(p_leader_id uuid, p_user_id uuid, p_rating integer, p_comment text, p_social_behaviour text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ratings("leaderId", "userId", rating, comment, "socialBehaviour", "updatedAt")
  VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now())
  ON CONFLICT ("leaderId", "userId")
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    "socialBehaviour" = EXCLUDED.socialBehaviour,
    "updatedAt" = now();

  UPDATE public.leaders
  SET
    rating = (SELECT AVG(r.rating) FROM public.ratings r WHERE r."leaderId" = p_leader_id),
    "reviewCount" = (SELECT COUNT(*) FROM public.ratings r WHERE r."leaderId" = p_leader_id)
  WHERE id = p_leader_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.handle_new_rating TO authenticated;

DROP FUNCTION IF EXISTS public.handle_rating_deletion;
CREATE OR REPLACE FUNCTION public.handle_rating_deletion(p_user_id uuid, p_leader_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ratings WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;
  UPDATE public.leaders
  SET
    rating = COALESCE((SELECT AVG(r.rating) FROM public.ratings r WHERE r."leaderId" = p_leader_id), 0),
    "reviewCount" = (SELECT COUNT(*) FROM public.ratings r WHERE r."leaderId" = p_leader_id)
  WHERE id = p_leader_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.handle_rating_deletion TO service_role;

DROP FUNCTION IF EXISTS public.get_reviews_for_leader;
CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE(userName text, rating int, comment text, updatedAt timestamptz, socialBehaviour text)
LANGUAGE sql
AS $$
  SELECT u.name, r.rating, r.comment, r."updatedAt", r."socialBehaviour"
  FROM public.ratings r
  JOIN public.users u ON r."userId" = u.id
  WHERE r."leaderId" = p_leader_id
  ORDER BY r."updatedAt" DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_leader TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_user_activities;
CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating integer,
    comment text,
    "updatedAt" timestamptz,
    leader json,
    "socialBehaviour" text,
    "userName" text
)
LANGUAGE sql
AS $$
    SELECT
        r."leaderId",
        l.name AS "leaderName",
        l."photoUrl" AS "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) AS leader,
        r."socialBehaviour",
        u.name AS "userName"
    FROM
        public.ratings r
    JOIN
        public.leaders l ON r."leaderId" = l.id
    JOIN
        public.users u ON r."userId" = u.id
    WHERE
        r."userId" = p_user_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_activities TO authenticated;

DROP FUNCTION IF EXISTS public.get_all_activities;
CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating integer,
    comment text,
    "updatedAt" timestamptz,
    leader json,
    "socialBehaviour" text,
    "userName" text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        r."leaderId",
        l.name AS "leaderName",
        l."photoUrl" AS "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) AS leader,
        r."socialBehaviour",
        u.name AS "userName"
    FROM
        public.ratings r
    JOIN
        public.leaders l ON r."leaderId" = l.id
    JOIN
        public.users u ON r."userId" = u.id
    ORDER BY r."updatedAt" DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_activities TO service_role;


-- Grant permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_responses TO service_role;

GRANT USAGE, SELECT ON SEQUENCE polls_id_seq TO service_role;
-- Add other sequences if needed for other tables.

GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.leaders TO authenticated, anon;
GRANT SELECT ON public.ratings TO authenticated, anon;
GRANT SELECT ON public.site_settings TO authenticated, anon;
GRANT SELECT ON public.notifications TO authenticated, anon;
GRANT SELECT ON public.polls TO authenticated, anon;
GRANT SELECT ON public.poll_questions TO authenticated, anon;
GRANT SELECT ON public.poll_options TO authenticated, anon;

GRANT INSERT ON public.leaders TO authenticated;
GRANT INSERT ON public.ratings TO authenticated;
GRANT INSERT ON public.support_tickets TO authenticated;
GRANT INSERT ON public.poll_responses TO authenticated;

GRANT UPDATE ON public.users TO authenticated;
GRANT UPDATE ON public.leaders TO authenticated;
GRANT UPDATE ON public.ratings TO authenticated;
GRANT UPDATE ON public.admin_messages TO authenticated;

-- Make sure RLS is enforced
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leaders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ratings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.polls FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_questions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses FORCE ROW LEVEL SECURITY;

-- Handle user creation trigger to populate users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p_poll_id),
        'genderDistribution', (
            SELECT json_agg(json_build_object('name', COALESCE(u.gender, 'Unknown'), 'value', COUNT(u.gender)))
            FROM poll_responses pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.poll_id = p_poll_id
            GROUP BY u.gender
        ),
        'questions', (
            SELECT json_agg(
                json_build_object(
                    'id', q.id,
                    'text', q.question_text,
                    'answers', (
                        SELECT json_agg(json_build_object('name', o.option_text, 'value', COUNT(r.id)))
                        FROM poll_options o
                        LEFT JOIN poll_responses r ON o.id = r.option_id
                        WHERE o.question_id = q.id
                        GROUP BY o.option_text
                    )
                )
            )
            FROM poll_questions q
            WHERE q.poll_id = p_poll_id
        )
    )
    INTO result
    FROM polls p
    WHERE p.id = p_poll_id;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE(total bigint, open bigint, in_progress bigint, resolved bigint, closed bigint, avg_resolution_hours numeric)
LANGUAGE sql
AS $$
    SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
    FROM support_tickets;
$$;

CREATE OR REPLACE FUNCTION get_admin_polls()
RETURNS TABLE(id uuid, title text, is_active boolean, active_until timestamptz, created_at timestamptz, response_count bigint, is_promoted boolean)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT COUNT(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        EXISTS(SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM
        polls p
    ORDER BY
        p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_active_polls_for_user(p_user_id uuid)
RETURNS TABLE(id uuid, title text, is_active boolean, active_until timestamptz, created_at timestamptz, response_count bigint, user_has_voted boolean, description text, is_promoted boolean)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT COUNT(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        CASE
            WHEN p_user_id IS NULL THEN false
            ELSE EXISTS(SELECT 1 FROM poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id)
        END as user_has_voted,
        p.description,
        EXISTS(SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM
        polls p
    WHERE
        p.is_active = true
        AND (p.active_until IS NULL OR p.active_until > now())
    ORDER BY
        p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_poll(poll_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_poll_id uuid;
    q_data jsonb;
    o_data jsonb;
    v_question_id uuid;
BEGIN
    IF poll_data->>'id' = '' THEN
        INSERT INTO polls (title, description, is_active, active_until)
        VALUES (poll_data->>'title', poll_data->>'description', (poll_data->>'is_active')::boolean, (poll_data->>'active_until')::timestamptz)
        RETURNING id INTO v_poll_id;
    ELSE
        v_poll_id := (poll_data->>'id')::uuid;
        UPDATE polls
        SET
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = v_poll_id;
        
        DELETE FROM poll_questions WHERE poll_id = v_poll_id;
    END IF;

    FOR q_data IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        INSERT INTO poll_questions (poll_id, question_text, question_type, question_order)
        VALUES (v_poll_id, q_data->>'question_text', q_data->>'question_type', (q_data->>'question_order')::int)
        RETURNING id INTO v_question_id;

        FOR o_data IN SELECT * FROM jsonb_array_elements(q_data->'options')
        LOOP
            INSERT INTO poll_options (question_id, option_text, option_order)
            VALUES (v_question_id, o_data->>'option_text', (o_data->>'option_order')::int);
        END LOOP;
    END LOOP;

    RETURN v_poll_id;
END;
$$;

CREATE OR REPLACE FUNCTION submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    answer jsonb;
BEGIN
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
    END IF;

    FOR answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (p_poll_id, (answer->>'questionId')::uuid, (answer->>'optionId')::uuid, p_user_id);
    END LOOP;
END;
$$;
