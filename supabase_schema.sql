-- #############################################################################
-- ###########################       TABLES        #############################
-- #############################################################################

-- Users Table: Extends auth.users with public profile data
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
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
comment on table public.users is 'Public user profile information.';

-- Leaders Table: Stores information about political leaders
CREATE TABLE IF NOT EXISTS public.leaders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "partyName" text,
    gender text,
    age integer,
    "photoUrl" text,
    constituency text NOT NULL,
    "nativeAddress" text,
    "electionType" text NOT NULL,
    location jsonb,
    rating numeric(3, 2) DEFAULT 0.00,
    "reviewCount" integer DEFAULT 0,
    "previousElections" jsonb,
    "manifestoUrl" text,
    "twitterUrl" text,
    "addedByUserId" uuid REFERENCES public.users(id),
    "createdAt" timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text NOT NULL,
    "adminComment" text
);
comment on table public.leaders is 'Stores data about political leaders.';

-- Ratings Table: User ratings and comments for leaders
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
comment on table public.ratings is 'User ratings and comments for leaders.';


-- Admin Messages Table
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now()
);
comment on table public.admin_messages is 'Messages sent from admins to users.';

-- Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id smallint PRIMARY KEY DEFAULT 1,
    maintenance_active boolean DEFAULT false NOT NULL,
    maintenance_start timestamp with time zone,
    maintenance_end timestamp with time zone,
    maintenance_message text,
    contact_email text,
    contact_phone text,
    contact_twitter text,
    contact_linkedin text,
    contact_youtube text,
    contact_facebook text,
    CONSTRAINT single_row_check CHECK (id = 1)
);
comment on table public.site_settings is 'Global site configuration.';

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    link text
);
comment on table public.notifications is 'Site-wide notification banners.';


-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    resolved_at timestamp with time zone,
    admin_notes text
);
comment on table public.support_tickets is 'User-submitted support tickets.';

-- Polls Tables
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT false,
    active_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
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
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (question_id, user_id) -- A user can only answer a question once
);

-- #############################################################################
-- ###########################     RLS & POLICIES    ###########################
-- #############################################################################

-- Enable RLS for all tables
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

-- Policies for 'users'
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for 'leaders'
DROP POLICY IF EXISTS "Public can view approved leaders." ON public.leaders;
CREATE POLICY "Public can view approved leaders." ON public.leaders FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can add leaders." ON public.leaders;
CREATE POLICY "Authenticated users can add leaders." ON public.leaders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update leaders they added." ON public.leaders;
CREATE POLICY "Users can update leaders they added." ON public.leaders FOR UPDATE TO authenticated USING ("addedByUserId" = auth.uid()) WITH CHECK ("addedByUserId" = auth.uid());


-- Policies for 'ratings'
DROP POLICY IF EXISTS "Public can view all ratings." ON public.ratings;
CREATE POLICY "Public can view all ratings." ON public.ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own rating." ON public.ratings;
CREATE POLICY "Users can insert their own rating." ON public.ratings FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "Users can update their own rating." ON public.ratings;
CREATE POLICY "Users can update their own rating." ON public.ratings FOR UPDATE TO authenticated USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());


-- Policies for 'admin_messages'
DROP POLICY IF EXISTS "Users can view their own messages." ON public.admin_messages;
CREATE POLICY "Users can view their own messages." ON public.admin_messages FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark their messages as read." ON public.admin_messages;
CREATE POLICY "Users can mark their messages as read." ON public.admin_messages FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (is_read = true);

-- Policies for 'site_settings'
DROP POLICY IF EXISTS "Public can view site settings." ON public.site_settings;
CREATE POLICY "Public can view site settings." ON public.site_settings FOR SELECT USING (true);

-- Policies for 'notifications'
DROP POLICY IF EXISTS "Public can view notifications." ON public.notifications;
CREATE POLICY "Public can view notifications." ON public.notifications FOR SELECT USING (true);

-- Policies for 'support_tickets'
DROP POLICY IF EXISTS "Authenticated users can create support tickets." ON public.support_tickets;
CREATE POLICY "Authenticated users can create support tickets." ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Policies for Polls
DROP POLICY IF EXISTS "Public can view active polls and their structure." ON public.polls;
CREATE POLICY "Public can view active polls and their structure." ON public.polls FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view poll questions." ON public.poll_questions;
CREATE POLICY "Public can view poll questions." ON public.poll_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view poll options." ON public.poll_options;
CREATE POLICY "Public can view poll options." ON public.poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can submit poll responses." ON public.poll_responses;
CREATE POLICY "Users can submit poll responses." ON public.poll_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own poll responses." ON public.poll_responses;
CREATE POLICY "Users can view their own poll responses." ON public.poll_responses FOR SELECT USING (user_id = auth.uid());

-- #############################################################################
-- ###################       TRIGGERS & FUNCTIONS       ########################
-- #############################################################################

-- Function to copy new user from auth.users to public.users
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

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to update rating and review count on leaders table
CREATE OR REPLACE FUNCTION public.update_leader_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.leaders
  SET
    "reviewCount" = (SELECT COUNT(*) FROM public.ratings WHERE "leaderId" = NEW."leaderId"),
    rating = (SELECT AVG(rating) FROM public.ratings WHERE "leaderId" = NEW."leaderId")
  WHERE id = NEW."leaderId";
  RETURN NEW;
END;
$$;

-- Trigger for new/updated ratings
DROP TRIGGER IF EXISTS on_rating_change ON public.ratings;
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_leader_rating();


-- RPC for handling new/update rating submission
CREATE OR REPLACE FUNCTION public.handle_new_rating(
    p_leader_id uuid,
    p_user_id uuid,
    p_rating integer,
    p_comment text,
    p_social_behaviour text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "createdAt", "updatedAt")
  VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now(), now())
  ON CONFLICT ("leaderId", "userId")
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    "socialBehaviour" = EXCLUDED."socialBehaviour",
    "updatedAt" = now();
END;
$$;

-- RPC to handle rating deletion and recalculation
CREATE OR REPLACE FUNCTION public.handle_rating_deletion(p_user_id uuid, p_leader_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_review_count integer;
  v_avg_rating numeric;
BEGIN
  -- Delete the rating
  DELETE FROM public.ratings WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;

  -- Recalculate review count and average rating
  SELECT
    COUNT(*),
    AVG(rating)
  INTO
    v_review_count,
    v_avg_rating
  FROM public.ratings
  WHERE "leaderId" = p_leader_id;

  -- Update the leaders table
  UPDATE public.leaders
  SET
    "reviewCount" = v_review_count,
    rating = COALESCE(v_avg_rating, 0)
  WHERE id = p_leader_id;
END;
$$;

-- RPC to get reviews for a leader
CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE (
  "userName" text,
  rating integer,
  comment text,
  "updatedAt" timestamptz,
  "socialBehaviour" text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.name,
    r.rating,
    r.comment,
    r."updatedAt",
    r."socialBehaviour"
  FROM public.ratings AS r
  JOIN public.users AS u ON r."userId" = u.id
  WHERE r."leaderId" = p_leader_id
  ORDER BY r."updatedAt" DESC;
END;
$$;

-- RPC to get activities for a user
CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE (
  "leaderId" uuid,
  "leaderName" text,
  "leaderPhotoUrl" text,
  rating integer,
  comment text,
  "updatedAt" timestamptz,
  "socialBehaviour" text,
  leader jsonb,
  "userName" text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS "leaderId",
    l.name AS "leaderName",
    l."photoUrl" AS "leaderPhotoUrl",
    r.rating,
    r.comment,
    r."updatedAt",
    r."socialBehaviour",
    row_to_json(l) as leader,
    u.name as "userName"
  FROM public.ratings AS r
  JOIN public.leaders AS l ON r."leaderId" = l.id
  JOIN public.users AS u ON r."userId" = u.id
  WHERE r."userId" = p_user_id
  ORDER BY r."updatedAt" DESC;
END;
$$;

-- RPC to get all activities (for admin)
CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE (
  "leaderId" uuid,
  "leaderName" text,
  "leaderPhotoUrl" text,
  rating integer,
  comment text,
  "updatedAt" timestamptz,
  "socialBehaviour" text,
  leader jsonb,
  "userName" text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS "leaderId",
    l.name AS "leaderName",
    l."photoUrl" AS "leaderPhotoUrl",
    r.rating,
    r.comment,
    r."updatedAt",
    r."socialBehaviour",
    row_to_json(l) as leader,
    u.name as "userName"
  FROM public.ratings AS r
  JOIN public.leaders AS l ON r."leaderId" = l.id
  JOIN public.users AS u ON r."userId" = u.id
  ORDER BY r."updatedAt" DESC;
END;
$$;

-- RPCs for Polls
CREATE OR REPLACE FUNCTION public.get_admin_polls()
RETURNS TABLE (
    id uuid,
    title text,
    is_active boolean,
    active_until timestamp with time zone,
    created_at timestamp with time zone,
    response_count bigint,
    is_promoted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT COUNT(DISTINCT pr.user_id) FROM public.poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        EXISTS (SELECT 1 FROM public.notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM
        public.polls p
    ORDER BY
        p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_poll(poll_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    poll_id_val uuid;
    question_data jsonb;
    option_data jsonb;
    question_id_val uuid;
BEGIN
    -- Upsert Poll
    IF poll_data->>'id' IS NOT NULL AND poll_data->>'id' != '' THEN
        poll_id_val := (poll_data->>'id')::uuid;
        UPDATE polls SET
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = poll_id_val;
    ELSE
        INSERT INTO polls (title, description, is_active, active_until)
        VALUES (
            poll_data->>'title',
            poll_data->>'description',
            (poll_data->>'is_active')::boolean,
            (poll_data->>'active_until')::timestamptz
        ) RETURNING id INTO poll_id_val;
    END IF;

    -- Delete old questions and options to handle deletions
    DELETE FROM poll_options WHERE question_id IN (SELECT id FROM poll_questions WHERE poll_id = poll_id_val);
    DELETE FROM poll_questions WHERE poll_id = poll_id_val;

    -- Insert/Update Questions and Options
    FOR question_data IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        INSERT INTO poll_questions (poll_id, question_text, question_type, question_order)
        VALUES (
            poll_id_val,
            question_data->>'question_text',
            question_data->>'question_type',
            (question_data->>'question_order')::integer
        ) RETURNING id INTO question_id_val;
        
        FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
        LOOP
            INSERT INTO poll_options (question_id, option_text, option_order)
            VALUES (
                question_id_val,
                option_data->>'option_text',
                (option_data->>'option_order')::integer
            );
        END LOOP;
    END LOOP;

    RETURN poll_id_val;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p_poll_id),
        'genderDistribution', (
            SELECT json_agg(json_build_object('name', COALESCE(u.gender, 'Unknown'), 'value', count(*)))
            FROM poll_responses pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.poll_id = p_poll_id
            GROUP BY u.gender
        ),
        'questions', (
            SELECT json_agg(
                json_build_object(
                    'id', pq.id,
                    'text', pq.question_text,
                    'answers', (
                        SELECT json_agg(
                            json_build_object(
                                'name', po.option_text,
                                'value', (SELECT COUNT(*) FROM poll_responses WHERE option_id = po.id)
                            )
                        )
                        FROM poll_options po
                        WHERE po.question_id = pq.id
                    )
                )
            )
            FROM poll_questions pq
            WHERE pq.poll_id = p_poll_id
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
    user_has_voted boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.description,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT count(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id),
        (EXISTS (SELECT 1 FROM poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id))
    FROM
        polls p
    WHERE
        p.is_active = true
        AND (p.active_until IS NULL OR p.active_until > now());
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_poll_response(
    p_poll_id uuid,
    p_user_id uuid,
    p_answers jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    answer jsonb;
BEGIN
    -- Check if user has already voted
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll';
    END IF;

    FOR answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (
            p_poll_id,
            (answer->>'questionId')::uuid,
            (answer->>'optionId')::uuid,
            p_user_id
        );
    END LOOP;
END;
$$;

-- RPC for support ticket stats
CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE(
    total bigint,
    open bigint,
    in_progress bigint,
    resolved bigint,
    closed bigint,
    avg_resolution_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        count(*) AS total,
        count(*) FILTER (WHERE status = 'open') AS open,
        count(*) FILTER (WHERE status = 'in-progress') AS in_progress,
        count(*) FILTER (WHERE status = 'resolved') AS resolved,
        count(*) FILTER (WHERE status = 'closed') AS closed,
        avg(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
        ) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
    FROM public.support_tickets;
END;
$$;

-- #############################################################################
-- ###########################        GRANTS         ###########################
-- #############################################################################

-- Grant usage on the public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on all tables to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant insert, update, delete on tables for authenticated role (RLS will handle specifics)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on all functions to anon and authenticated
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant all privileges to the service_role (used by supabaseAdmin)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
