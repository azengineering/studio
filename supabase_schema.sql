-- Enable the citext extension for case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

-- =============================================
-- Tables
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying NOT NULL UNIQUE,
    name character varying,
    gender public.citext,
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

CREATE TABLE IF NOT EXISTS public.leaders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    "partyName" character varying NOT NULL,
    gender public.citext NOT NULL,
    age integer NOT NULL,
    "photoUrl" text,
    constituency character varying NOT NULL,
    "nativeAddress" text NOT NULL,
    "electionType" public.citext NOT NULL,
    location jsonb,
    rating real DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "previousElections" jsonb,
    "manifestoUrl" text,
    "twitterUrl" text,
    "addedByUserId" uuid REFERENCES public.users(id),
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    status public.citext DEFAULT 'pending'::public.citext NOT NULL,
    "adminComment" text
);

CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "leaderId" uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    comment text,
    "socialBehaviour" public.citext,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE ("leaderId", "userId")
);

CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id integer PRIMARY KEY,
    maintenance_active boolean DEFAULT false,
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
-- Ensure the single row exists for site settings
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    message text NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    link text
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_name character varying NOT NULL,
    user_email character varying NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status public.citext DEFAULT 'open'::public.citext NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    admin_notes text
);

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
    question_type public.citext NOT NULL,
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
    UNIQUE(question_id, user_id)
);


-- =============================================
-- RLS (Row Level Security)
-- =============================================
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


-- =============================================
-- Policies
-- =============================================
-- users table
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- leaders table
DROP POLICY IF EXISTS "Allow anonymous read access to approved leaders" ON public.leaders;
CREATE POLICY "Allow anonymous read access to approved leaders" ON public.leaders FOR SELECT USING (status = 'approved'::public.citext);
DROP POLICY IF EXISTS "Allow authenticated users to add leaders" ON public.leaders;
CREATE POLICY "Allow authenticated users to add leaders" ON public.leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow owners to update their own leaders" ON public.leaders;
CREATE POLICY "Allow owners to update their own leaders" ON public.leaders FOR UPDATE USING (auth.uid() = "addedByUserId") WITH CHECK (auth.uid() = "addedByUserId");

-- ratings table
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.ratings;
CREATE POLICY "Allow read access to everyone" ON public.ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert their own rating" ON public.ratings;
CREATE POLICY "Allow authenticated users to insert their own rating" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = "userId");
DROP POLICY IF EXISTS "Allow users to update their own ratings" ON public.ratings;
CREATE POLICY "Allow users to update their own ratings" ON public.ratings FOR UPDATE USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

-- admin_messages table
DROP POLICY IF EXISTS "Users can view their own messages" ON public.admin_messages;
CREATE POLICY "Users can view their own messages" ON public.admin_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can mark their own messages as read" ON public.admin_messages;
CREATE POLICY "Users can mark their own messages as read" ON public.admin_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- site_settings table
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.site_settings;
CREATE POLICY "Allow public read access to settings" ON public.site_settings FOR SELECT USING (true);

-- notifications table
DROP POLICY IF EXISTS "Allow public read access to notifications" ON public.notifications;
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);

-- support_tickets table
DROP POLICY IF EXISTS "Allow users to create support tickets" ON public.support_tickets;
CREATE POLICY "Allow users to create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- polls tables
DROP POLICY IF EXISTS "Allow public read access to polls" ON public.polls;
CREATE POLICY "Allow public read access to polls" ON public.polls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access to poll questions" ON public.poll_questions;
CREATE POLICY "Allow public read access to poll questions" ON public.poll_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access to poll options" ON public.poll_options;
CREATE POLICY "Allow public read access to poll options" ON public.poll_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to insert their own responses" ON public.poll_responses;
CREATE POLICY "Allow users to insert their own responses" ON public.poll_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own poll responses" ON public.poll_responses;
CREATE POLICY "Users can view their own poll responses" ON public.poll_responses FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to create a user profile when a new user signs up in auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$;

-- Trigger to call the function after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle a new rating submission (insert or update) and recalculate leader's average
CREATE OR REPLACE FUNCTION public.handle_new_rating(
    p_leader_id uuid,
    p_user_id uuid,
    p_rating integer,
    p_comment text,
    p_social_behaviour public.citext
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_avg_rating REAL;
    v_review_count INT;
BEGIN
    -- Upsert the rating
    INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "updatedAt")
    VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now())
    ON CONFLICT ("leaderId", "userId")
    DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        "socialBehaviour" = EXCLUDED."socialBehaviour",
        "updatedAt" = now();

    -- Recalculate average rating and count
    SELECT
        AVG(r.rating),
        COUNT(r.id)
    INTO
        v_avg_rating,
        v_review_count
    FROM
        public.ratings r
    WHERE
        r."leaderId" = p_leader_id;

    -- Update the leaders table
    UPDATE public.leaders
    SET
        rating = v_avg_rating,
        "reviewCount" = v_review_count
    WHERE
        id = p_leader_id;
END;
$$;

-- Function to delete a rating and recalculate average
CREATE OR REPLACE FUNCTION public.handle_rating_deletion(
    p_user_id uuid,
    p_leader_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_avg_rating REAL;
    v_review_count INT;
BEGIN
    -- Delete the rating
    DELETE FROM public.ratings
    WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;

    -- Recalculate average rating and count
    SELECT
        AVG(r.rating),
        COUNT(r.id)
    INTO
        v_avg_rating,
        v_review_count
    FROM
        public.ratings r
    WHERE
        r."leaderId" = p_leader_id;

    -- Update the leaders table
    UPDATE public.leaders
    SET
        rating = COALESCE(v_avg_rating, 0),
        "reviewCount" = COALESCE(v_review_count, 0)
    WHERE
        id = p_leader_id;
END;
$$;

-- Function for a logged-in user to see their activities
CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" character varying,
    "leaderPhotoUrl" text,
    rating integer,
    comment text,
    "updatedAt" timestamp with time zone,
    leader public.leaders,
    "socialBehaviour" public.citext,
    "userName" character varying
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r."leaderId",
    l.name AS "leaderName",
    l."photoUrl" AS "leaderPhotoUrl",
    r.rating,
    r.comment,
    r."updatedAt",
    l AS leader,
    r."socialBehaviour",
    u.name AS "userName"
  FROM ratings r
  JOIN leaders l ON r."leaderId" = l.id
  JOIN users u ON r."userId" = u.id
  WHERE r."userId" = p_user_id
  ORDER BY r."updatedAt" DESC;
$$;

-- Function for admin to see all activities
CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" character varying,
    "leaderPhotoUrl" text,
    rating integer,
    comment text,
    "updatedAt" timestamp with time zone,
    leader public.leaders,
    "socialBehaviour" public.citext,
    "userName" character varying
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r."leaderId",
    l.name AS "leaderName",
    l."photoUrl" AS "leaderPhotoUrl",
    r.rating,
    r.comment,
    r."updatedAt",
    l AS leader,
    r."socialBehaviour",
    u.name AS "userName"
  FROM ratings r
  JOIN leaders l ON r."leaderId" = l.id
  JOIN users u ON r."userId" = u.id
  ORDER BY r."updatedAt" DESC;
$$;


-- Function to get all reviews for a leader
CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE (
    "userName" text,
    rating integer,
    comment text,
    "updatedAt" timestamp with time zone,
    "socialBehaviour" public.citext
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.name AS "userName",
    r.rating,
    r.comment,
    r."updatedAt",
    r."socialBehaviour"
  FROM public.ratings r
  JOIN public.users u ON r."userId" = u.id
  WHERE r."leaderId" = p_leader_id
  ORDER BY r."updatedAt" DESC;
$$;


CREATE OR REPLACE FUNCTION public.upsert_poll(poll_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_poll_id uuid;
    v_question jsonb;
    v_question_id uuid;
    v_option jsonb;
    v_option_id uuid;
BEGIN
    -- Upsert Poll
    IF poll_data ? 'id' AND poll_data->>'id' != '' THEN
        v_poll_id := (poll_data->>'id')::uuid;
        UPDATE polls
        SET
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = v_poll_id;
    ELSE
        INSERT INTO polls (title, description, is_active, active_until)
        VALUES (
            poll_data->>'title',
            poll_data->>'description',
            (poll_data->>'is_active')::boolean,
            (poll_data->>'active_until')::timestamptz
        ) RETURNING id INTO v_poll_id;
    END IF;

    -- Upsert Questions and Options
    FOR v_question IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        -- Upsert Question
        IF v_question ? 'id' AND v_question->>'id' != '' THEN
            v_question_id := (v_question->>'id')::uuid;
            UPDATE poll_questions
            SET
                question_text = v_question->>'question_text',
                question_type = (v_question->>'question_type')::public.citext,
                question_order = (v_question->>'question_order')::int
            WHERE id = v_question_id;
        ELSE
            INSERT INTO poll_questions (poll_id, question_text, question_type, question_order)
            VALUES (
                v_poll_id,
                v_question->>'question_text',
                (v_question->>'question_type')::public.citext,
                (v_question->>'question_order')::int
            ) RETURNING id INTO v_question_id;
        END IF;

        -- Delete old options for this question before upserting new ones
        DELETE FROM poll_options WHERE question_id = v_question_id;

        -- Insert Options
        FOR v_option IN SELECT * FROM jsonb_array_elements(v_question->'options')
        LOOP
            INSERT INTO poll_options (question_id, option_text, option_order)
            VALUES (
                v_question_id,
                v_option->>'option_text',
                (v_option->>'option_order')::int
            );
        END LOOP;
    END LOOP;

    RETURN v_poll_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_admin_polls()
RETURNS TABLE(
    id uuid,
    title text,
    is_active boolean,
    active_until timestamp with time zone,
    created_at timestamp with time zone,
    response_count bigint,
    is_promoted boolean
)
LANGUAGE sql
STABLE
AS $$
SELECT
    p.id,
    p.title,
    p.is_active,
    p.active_until,
    p.created_at,
    (SELECT count(DISTINCT user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
    EXISTS (SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id) as is_promoted
FROM
    polls p
ORDER BY
    p.created_at DESC;
$$;


CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p.id),
        'genderDistribution', (
            SELECT COALESCE(jsonb_agg(gd), '[]'::jsonb) FROM (
                SELECT
                    COALESCE(u.gender, 'Unknown') as name,
                    COUNT(DISTINCT pr.user_id) as value
                FROM poll_responses pr
                JOIN users u ON pr.user_id = u.id
                WHERE pr.poll_id = p.id
                GROUP BY u.gender
            ) gd
        ),
        'questions', (
            SELECT jsonb_agg(q_res) FROM (
                SELECT
                    q.id,
                    q.question_text as text,
                    (
                        SELECT COALESCE(jsonb_agg(o_res), '[]'::jsonb) FROM (
                            SELECT
                                o.option_text as name,
                                COUNT(pr.id) as value
                            FROM poll_options o
                            LEFT JOIN poll_responses pr ON pr.option_id = o.id
                            WHERE o.question_id = q.id
                            GROUP BY o.option_text
                            ORDER BY o.option_order
                        ) o_res
                    ) as answers
                FROM poll_questions q
                WHERE q.poll_id = p.id
                ORDER BY q.question_order
            ) q_res
        )
    )
    INTO result
    FROM polls p
    WHERE p.id = p_poll_id;

    RETURN result;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_active_polls_for_user(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    is_active boolean,
    active_until timestamp with time zone,
    created_at timestamp with time zone,
    response_count bigint,
    user_has_voted boolean,
    is_promoted boolean
)
LANGUAGE sql
STABLE
AS $$
SELECT
    p.id,
    p.title,
    p.description,
    p.is_active,
    p.active_until,
    p.created_at,
    (SELECT count(DISTINCT user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
    (CASE WHEN p_user_id IS NULL THEN false ELSE EXISTS (SELECT 1 FROM poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id) END) as user_has_voted,
    EXISTS (SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id) as is_promoted
FROM
    polls p
WHERE
    p.is_active = true AND (p.active_until IS NULL OR p.active_until > now())
ORDER BY
    p.created_at DESC;
$$;


CREATE OR REPLACE FUNCTION public.submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_answer jsonb;
BEGIN
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
    END IF;

    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (
            p_poll_id,
            (v_answer->>'questionId')::uuid,
            (v_answer->>'optionId')::uuid,
            p_user_id
        );
    END LOOP;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE (
    total bigint,
    open bigint,
    in_progress bigint,
    resolved bigint,
    closed bigint,
    avg_resolution_hours double precision
)
LANGUAGE sql
STABLE
AS $$
SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'open') AS open,
    COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
    COUNT(*) FILTER (WHERE status = 'closed') AS closed,
    EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600 AS avg_resolution_hours
FROM support_tickets
WHERE resolved_at IS NOT NULL;
$$;


CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()))
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- Permissions
-- =============================================
GRANT EXECUTE ON FUNCTION public.handle_new_rating(uuid, uuid, integer, text, public.citext) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_leader(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION public.get_user_activities(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_polls_for_user(uuid) to anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_poll_response(uuid, uuid, jsonb) to authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists() TO authenticated;
