
-- ===============================================================================================
--                                       POLITIRATE - SUPABASE SCHEMA
-- ===============================================================================================
-- This script is idempotent and can be run multiple times safely.
-- It sets up all tables, enables Row-Level Security (RLS), creates all policies, and defines
-- necessary database functions for the entire application to work correctly and securely.
-- ===============================================================================================


-- ===============================================================================================
-- 1. TABLE CREATION
-- ===============================================================================================

-- Users table to store public profile information
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying NOT NULL UNIQUE,
    name character varying,
    gender character varying,
    age integer,
    state character varying,
    "mpConstituency" character varying,
    "mlaConstituency" character varying,
    panchayat character varying,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockedUntil" timestamp with time zone,
    "blockReason" text
);

-- Leaders table
CREATE TABLE IF NOT EXISTS public.leaders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    "partyName" character varying NOT NULL,
    gender character varying NOT NULL,
    age integer NOT NULL,
    "photoUrl" text,
    constituency character varying NOT NULL,
    "nativeAddress" text,
    "electionType" character varying NOT NULL,
    location jsonb,
    rating real DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "previousElections" jsonb,
    "manifestoUrl" text,
    "twitterUrl" text,
    "addedByUserId" uuid REFERENCES public.users(id) ON DELETE SET NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    status public.citext DEFAULT 'pending'::public.citext NOT NULL,
    "adminComment" text
);

-- Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    "leaderId" uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    comment text,
    "socialBehaviour" character varying,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("leaderId", "userId")
);

-- Admin Messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id smallint PRIMARY KEY DEFAULT 1,
    maintenance_active boolean DEFAULT false,
    maintenance_start timestamp with time zone,
    maintenance_end timestamp with time zone,
    maintenance_message text,
    contact_email text,
    contact_phone text,
    contact_twitter text,
    contact_linkedin text,
    contact_youtube text,
    contact_facebook text,
    CONSTRAINT single_row_constraint CHECK (id = 1)
);
-- Insert default settings row if it doesn't exist
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- Polls tables
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT false NOT NULL,
    active_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type public.citext NOT NULL, -- 'yes_no' or 'multiple_choice'
    question_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    option_order integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(question_id, user_id) -- User can only answer a question once
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    message text NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status public.citext DEFAULT 'open'::public.citext NOT NULL, -- open, in-progress, resolved, closed
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    admin_notes text
);

-- ===============================================================================================
-- 2. ENABLE ROW-LEVEL SECURITY (RLS)
-- ===============================================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ===============================================================================================
-- 3. RLS POLICIES
-- ===============================================================================================

-- USERS table policies
DROP POLICY IF EXISTS "Allow individual user read access" ON public.users;
CREATE POLICY "Allow individual user read access" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual user update access" ON public.users;
CREATE POLICY "Allow individual user update access" ON public.users FOR UPDATE USING (auth.uid() = id);

-- LEADERS table policies
DROP POLICY IF EXISTS "Allow public read access to approved leaders" ON public.leaders;
CREATE POLICY "Allow public read access to approved leaders" ON public.leaders FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Allow authenticated users to insert leaders" ON public.leaders;
CREATE POLICY "Allow authenticated users to insert leaders" ON public.leaders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user to update their own submitted leader" ON public.leaders;
CREATE POLICY "Allow user to update their own submitted leader" ON public.leaders FOR UPDATE TO authenticated USING ("addedByUserId" = auth.uid());

-- RATINGS table policies
DROP POLICY IF EXISTS "Allow public read access" ON public.ratings;
CREATE POLICY "Allow public read access" ON public.ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert ratings" ON public.ratings;
CREATE POLICY "Allow authenticated users to insert ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Allow user to update their own rating" ON public.ratings;
CREATE POLICY "Allow user to update their own rating" ON public.ratings FOR UPDATE TO authenticated USING ("userId" = auth.uid());

-- ADMIN_MESSAGES table policies
DROP POLICY IF EXISTS "Allow user to read their own messages" ON public.admin_messages;
CREATE POLICY "Allow user to read their own messages" ON public.admin_messages FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow user to mark their own messages as read" ON public.admin_messages;
CREATE POLICY "Allow user to mark their own messages as read" ON public.admin_messages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (true);

-- SITE_SETTINGS table policies
DROP POLICY IF EXISTS "Allow public read access to site settings" ON public.site_settings;
CREATE POLICY "Allow public read access to site settings" ON public.site_settings FOR SELECT USING (true);

-- NOTIFICATIONS table policies
DROP POLICY IF EXISTS "Allow public read access to notifications" ON public.notifications;
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);

-- SUPPORT_TICKETS table policies
DROP POLICY IF EXISTS "Allow anyone to insert a support ticket" ON public.support_tickets;
CREATE POLICY "Allow anyone to insert a support ticket" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- POLLS table policies
DROP POLICY IF EXISTS "Allow public read access to active polls" ON public.polls;
CREATE POLICY "Allow public read access to active polls" ON public.polls FOR SELECT USING (is_active = true);

-- POLL_QUESTIONS table policies
DROP POLICY IF EXISTS "Allow public read access" ON public.poll_questions;
CREATE POLICY "Allow public read access" ON public.poll_questions FOR SELECT USING (true);

-- POLL_OPTIONS table policies
DROP POLICY IF EXISTS "Allow public read access" ON public.poll_options;
CREATE POLICY "Allow public read access" ON public.poll_options FOR SELECT USING (true);

-- POLL_RESPONSES table policies
DROP POLICY IF EXISTS "Allow user to see their own responses" ON public.poll_responses;
CREATE POLICY "Allow user to see their own responses" ON public.poll_responses FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated user to insert a response" ON public.poll_responses;
CREATE POLICY "Allow authenticated user to insert a response" ON public.poll_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===============================================================================================
-- 4. DATABASE FUNCTIONS
-- ===============================================================================================

-- Function to create a user profile upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for the new user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle new ratings and update leader stats
CREATE OR REPLACE FUNCTION public.handle_new_rating(p_leader_id uuid, p_user_id uuid, p_rating integer, p_comment text, p_social_behaviour character varying)
RETURNS void AS $$
BEGIN
  -- Insert or update the rating
  INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "createdAt", "updatedAt")
  VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, NOW(), NOW())
  ON CONFLICT ("leaderId", "userId")
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    "socialBehaviour" = EXCLUDED."socialBehaviour",
    "updatedAt" = NOW();

  -- Recalculate and update the leader's average rating and review count
  UPDATE public.leaders
  SET
    "reviewCount" = (SELECT COUNT(*) FROM public.ratings WHERE "leaderId" = p_leader_id),
    rating = (SELECT AVG(rating) FROM public.ratings WHERE "leaderId" = p_leader_id)
  WHERE id = p_leader_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle rating deletion
CREATE OR REPLACE FUNCTION public.handle_rating_deletion(p_user_id uuid, p_leader_id uuid)
RETURNS void AS $$
DECLARE
  v_review_count int;
  v_avg_rating float;
BEGIN
  DELETE FROM public.ratings
  WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;

  SELECT COUNT(*), AVG(rating)
  INTO v_review_count, v_avg_rating
  FROM public.ratings
  WHERE "leaderId" = p_leader_id;

  UPDATE public.leaders
  SET 
    "reviewCount" = v_review_count,
    rating = COALESCE(v_avg_rating, 0)
  WHERE id = p_leader_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get reviews for a leader
CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE("userName" text, rating int, comment text, "updatedAt" timestamptz, "socialBehaviour" character varying) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.name,
    r.rating,
    r.comment,
    r."updatedAt",
    r."socialBehaviour"
  FROM public.ratings r
  JOIN public.users u ON r."userId" = u.id
  WHERE r."leaderId" = p_leader_id
  ORDER BY r."updatedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activities
CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE("leaderId" uuid, "leaderName" text, "leaderPhotoUrl" text, rating int, comment text, "updatedAt" timestamptz, leader json, "socialBehaviour" character varying, "userName" text) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id as "leaderId",
        l.name as "leaderName",
        l.photoUrl as "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) as leader,
        r."socialBehaviour",
        u.name as "userName"
    FROM
        public.ratings r
    JOIN
        public.leaders l ON r."leaderId" = l.id
    JOIN
        public.users u ON r."userId" = u.id
    WHERE
        r."userId" = p_user_id
    ORDER BY
        r."updatedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all activities (admin)
CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE("leaderId" uuid, "leaderName" text, "leaderPhotoUrl" text, rating int, comment text, "updatedAt" timestamptz, leader json, "socialBehaviour" character varying, "userName" text) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id as "leaderId",
        l.name as "leaderName",
        l.photoUrl as "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) as leader,
        r."socialBehaviour",
        u.name as "userName"
    FROM
        public.ratings r
    JOIN
        public.leaders l ON r."leaderId" = l.id
    JOIN
        public.users u ON r."userId" = u.id
    ORDER BY
        r."updatedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Poll Functions
CREATE OR REPLACE FUNCTION public.get_admin_polls()
RETURNS TABLE(id uuid, title text, is_active boolean, active_until timestamptz, created_at timestamptz, response_count bigint, is_promoted boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT count(DISTINCT pr.user_id) FROM public.poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        EXISTS(SELECT 1 FROM public.notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM
        public.polls p
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.upsert_poll(poll_data jsonb)
RETURNS uuid AS $$
DECLARE
    v_poll_id uuid;
    q jsonb;
    o jsonb;
    v_question_id uuid;
BEGIN
    -- Upsert poll
    IF poll_data->>'id' = '' THEN
        INSERT INTO public.polls (title, description, is_active, active_until)
        VALUES (poll_data->>'title', poll_data->>'description', (poll_data->>'is_active')::boolean, (poll_data->>'active_until')::timestamptz)
        RETURNING id INTO v_poll_id;
    ELSE
        v_poll_id := (poll_data->>'id')::uuid;
        UPDATE public.polls
        SET
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = v_poll_id;
    END IF;

    -- Remove old questions/options
    DELETE FROM public.poll_questions WHERE poll_id = v_poll_id;

    -- Insert new questions and options
    FOR q IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        INSERT INTO public.poll_questions (poll_id, question_text, question_type, question_order)
        VALUES (v_poll_id, q->>'question_text', q->>'question_type', (q->>'question_order')::integer)
        RETURNING id INTO v_question_id;

        FOR o IN SELECT * FROM jsonb_array_elements(q->'options')
        LOOP
            INSERT INTO public.poll_options (question_id, option_text, option_order)
            VALUES (v_question_id, o->>'option_text', (o->>'option_order')::integer);
        END LOOP;
    END LOOP;

    RETURN v_poll_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p_poll_id),
        'genderDistribution', (
            SELECT jsonb_agg(jsonb_build_object('name', COALESCE(u.gender, 'Unknown'), 'value', COUNT(DISTINCT pr.user_id)))
            FROM poll_responses pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.poll_id = p_poll_id
            GROUP BY u.gender
        ),
        'questions', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'text', q.question_text,
                    'answers', (
                        SELECT jsonb_agg(jsonb_build_object('name', o.option_text, 'value', COUNT(r.id)))
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_active_polls_for_user(p_user_id uuid)
RETURNS TABLE(id uuid, title text, description text, is_active boolean, active_until timestamptz, created_at timestamptz, response_count bigint, user_has_voted boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.description,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT count(DISTINCT pr.user_id) FROM public.poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        CASE
            WHEN p_user_id IS NULL THEN false
            ELSE EXISTS(SELECT 1 FROM public.poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id)
        END as user_has_voted
    FROM
        public.polls p
    WHERE
        p.is_active = true AND (p.active_until IS NULL OR p.active_until > now())
    ORDER BY
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void AS $$
DECLARE
    answer jsonb;
BEGIN
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
    END IF;

    FOR answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO public.poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (p_poll_id, (answer->>'questionId')::uuid, (answer->>'optionId')::uuid, p_user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE(total bigint, open bigint, in_progress bigint, resolved bigint, closed bigint, avg_resolution_hours double precision) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
    FROM public.support_tickets;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================================================
-- 5. GRANT PERMISSIONS
-- ===============================================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_rating(uuid, uuid, integer, text, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_leader(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activities(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_rating_deletion(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_activities() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_polls() TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_poll(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_poll_results(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_polls_for_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_poll_response(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_stats() TO service_role;

-- Grant usage on schema to required roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant select on all tables to anon and authenticated roles (RLS will handle row access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant insert, update, delete on all tables to authenticated role (RLS will handle row access)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant all permissions to the service_role (admin)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Allow anon role to use the public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;

-- Allow authenticated role to use the public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- Allow service_role to use the public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
