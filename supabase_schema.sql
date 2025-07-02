
-- Enable the citext extension for case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

BEGIN;

-- Drop existing policies to ensure a clean slate
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop policies for all tables in the public schema
    FOR policy_record IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public."' || policy_record.tablename || '";';
    END LOOP;
END;
$$;


-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email citext UNIQUE,
    name TEXT,
    gender TEXT,
    age INT,
    state TEXT,
    "mpConstituency" TEXT,
    "mlaConstituency" TEXT,
    panchayat TEXT,
    "createdAt" timestamptz DEFAULT now(),
    "isBlocked" boolean DEFAULT false,
    "blockedUntil" timestamptz,
    "blockReason" TEXT
);
COMMENT ON TABLE public.users IS 'Stores public user profile information.';

-- 2. LEADERS TABLE
CREATE TABLE IF NOT EXISTS public.leaders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INT NOT NULL,
    "photoUrl" TEXT,
    constituency TEXT NOT NULL,
    "nativeAddress" TEXT NOT NULL,
    "electionType" TEXT NOT NULL,
    location jsonb,
    rating float8 DEFAULT 0,
    "reviewCount" INT DEFAULT 0,
    "previousElections" jsonb,
    "manifestoUrl" TEXT,
    "twitterUrl" TEXT,
    "addedByUserId" uuid REFERENCES public.users(id),
    "createdAt" timestamptz DEFAULT now(),
    status citext DEFAULT 'pending' NOT NULL,
    "adminComment" TEXT
);
COMMENT ON TABLE public.leaders IS 'Stores information about political leaders.';

-- 3. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "leaderId" uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "socialBehaviour" TEXT,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now(),
    UNIQUE ("leaderId", "userId")
);
COMMENT ON TABLE public.ratings IS 'Stores user ratings and comments for leaders.';

-- 4. ADMIN MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    "isRead" boolean DEFAULT false,
    "createdAt" timestamptz DEFAULT now()
);
COMMENT ON TABLE public.admin_messages IS 'Stores messages sent from admins to users.';

-- 5. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    maintenance_active TEXT DEFAULT 'false',
    maintenance_start timestamptz,
    maintenance_end timestamptz,
    maintenance_message TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_twitter TEXT,
    contact_linkedin TEXT,
    contact_youtube TEXT,
    contact_facebook TEXT,
    CONSTRAINT single_row_check CHECK (id = 1)
);
COMMENT ON TABLE public.site_settings IS 'Global settings for the site.';

-- Insert default settings row if it doesn't exist
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    "startTime" timestamptz,
    "endTime" timestamptz,
    "isActive" boolean DEFAULT true,
    link TEXT,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.notifications IS 'Stores site-wide notifications/banners.';

-- 7. POLLS & RELATED TABLES
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_active boolean DEFAULT false,
    active_until timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'yes_no', 'multiple_choice'
    question_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE (question_id, user_id)
);
COMMENT ON TABLE public.polls IS 'Stores poll questions and metadata.';
COMMENT ON TABLE public.poll_responses IS 'Stores user responses to polls.';

-- 8. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status citext DEFAULT 'open' NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    admin_notes TEXT
);

-- RLS POLICIES --

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;


-- POLICIES
-- Users Table
CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Leaders Table
CREATE POLICY "Allow anyone to view approved leaders" ON public.leaders FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow authenticated users to add leaders" ON public.leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow original user to update their own submitted leader" ON public.leaders FOR UPDATE USING (auth.uid() = "addedByUserId") WITH CHECK (auth.uid() = "addedByUserId");

-- Ratings Table
CREATE POLICY "Allow anyone to view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Allow users to insert/update their own ratings" ON public.ratings FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

-- Admin Messages Table
CREATE POLICY "Allow users to view their own messages" ON public.admin_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to mark their own messages as read" ON public.admin_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Site Settings & Notifications Table (Read-only for public)
CREATE POLICY "Allow anyone to view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow anyone to view notifications" ON public.notifications FOR SELECT USING (true);

-- Polls, Questions, Options (Read-only for public if active)
CREATE POLICY "Allow anyone to view active polls" ON public.polls FOR SELECT USING (is_active = true);
CREATE POLICY "Allow anyone to view questions of active polls" ON public.poll_questions FOR SELECT USING (
    (SELECT is_active FROM public.polls WHERE id = poll_id) = true
);
CREATE POLICY "Allow anyone to view options for questions of active polls" ON public.poll_options FOR SELECT USING (
    (SELECT p.is_active FROM public.polls p JOIN public.poll_questions pq ON p.id = pq.poll_id WHERE pq.id = question_id) = true
);

-- Poll Responses Table
CREATE POLICY "Allow authenticated users to insert responses" ON public.poll_responses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to view their own responses" ON public.poll_responses FOR SELECT USING (auth.uid() = user_id);

-- Support Tickets Table
CREATE POLICY "Allow anyone to create a support ticket" ON public.support_tickets FOR INSERT WITH CHECK (true);
-- No SELECT, UPDATE, DELETE policies for users to protect privacy.


-- DATABASE FUNCTIONS --

-- Function to create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to recalculate a leader's average rating
CREATE OR REPLACE FUNCTION public.recalculate_leader_rating(p_leader_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.leaders
    SET
        rating = (SELECT COALESCE(AVG(rating), 0) FROM public.ratings WHERE "leaderId" = p_leader_id),
        "reviewCount" = (SELECT COUNT(*) FROM public.ratings WHERE "leaderId" = p_leader_id)
    WHERE id = p_leader_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle a new or updated rating
CREATE OR REPLACE FUNCTION public.handle_new_rating(p_leader_id uuid, p_user_id uuid, p_rating int, p_comment text, p_social_behaviour text)
RETURNS void AS $$
BEGIN
    INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "updatedAt")
    VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now())
    ON CONFLICT ("leaderId", "userId")
    DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        "socialBehaviour" = EXCLUDED."socialBehaviour",
        "updatedAt" = now();

    -- Recalculate leader's average rating
    PERFORM public.recalculate_leader_rating(p_leader_id);
END;
$$ LANGUAGE plpgsql;
-- Note: Invoked by user, so not SECURITY DEFINER

-- Function to handle rating deletion
CREATE OR REPLACE FUNCTION public.handle_rating_deletion(p_user_id uuid, p_leader_id uuid)
RETURNS void AS $$
BEGIN
    DELETE FROM public.ratings WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;
    PERFORM public.recalculate_leader_rating(p_leader_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for user activities page
CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    leader jsonb,
    "socialBehaviour" text,
    "userName" text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r."leaderId",
        l.name AS "leaderName",
        l."photoUrl" AS "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'partyName', l."partyName",
            'gender', l.gender,
            'age', l.age,
            'photoUrl', l."photoUrl",
            'constituency', l.constituency,
            'nativeAddress', l."nativeAddress",
            'electionType', l."electionType",
            'location', l.location,
            'rating', l.rating,
            'reviewCount', l."reviewCount",
            'previousElections', l."previousElections",
            'manifestoUrl', l."manifestoUrl",
            'twitterUrl', l."twitterUrl"
        ) as leader,
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

-- Function for all activities page (admin)
CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE(
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    leader jsonb,
    "socialBehaviour" text,
    "userName" text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r."leaderId",
        l.name AS "leaderName",
        l."photoUrl" AS "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        jsonb_build_object('id', l.id) as leader,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for reviews dialog
CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE (
    "userName" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    "socialBehaviour" text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.name as "userName",
        r.rating,
        r.comment,
        r."updatedAt",
        r."socialBehaviour"
    FROM
        public.ratings r
    JOIN
        public.users u ON r."userId" = u.id
    WHERE
        r."leaderId" = p_leader_id
    ORDER BY
        r."updatedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Function for polls admin list
CREATE OR REPLACE FUNCTION public.get_admin_polls()
RETURNS TABLE (
    id uuid,
    title text,
    is_active boolean,
    active_until timestamptz,
    created_at timestamptz,
    response_count bigint,
    is_promoted boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT COUNT(DISTINCT pr.user_id) FROM public.poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        EXISTS(SELECT 1 FROM public.notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM public.polls p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for upserting a poll
CREATE OR REPLACE FUNCTION public.upsert_poll(poll_data jsonb)
RETURNS uuid AS $$
DECLARE
    poll_id uuid;
    question jsonb;
    q_id uuid;
    option jsonb;
    o_id uuid;
BEGIN
    -- Upsert poll
    IF poll_data ? 'id' AND poll_data->>'id' != '' THEN
        poll_id := (poll_data->>'id')::uuid;
        UPDATE public.polls
        SET
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = poll_id;
    ELSE
        INSERT INTO public.polls (title, description, is_active, active_until)
        VALUES (
            poll_data->>'title',
            poll_data->>'description',
            (poll_data->>'is_active')::boolean,
            (poll_data->>'active_until')::timestamptz
        ) RETURNING id INTO poll_id;
    END IF;

    -- Delete old questions and options not in the new payload
    DELETE FROM public.poll_options WHERE question_id IN (SELECT id FROM public.poll_questions WHERE poll_id = poll_id)
        AND id NOT IN (SELECT (o->>'id')::uuid FROM jsonb_array_elements(poll_data->'questions') q, jsonb_array_elements(q->'options') o WHERE o ? 'id');
    DELETE FROM public.poll_questions WHERE poll_id = poll_id
        AND id NOT IN (SELECT (q->>'id')::uuid FROM jsonb_array_elements(poll_data->'questions') q WHERE q ? 'id');

    -- Upsert questions
    FOR question IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        IF question ? 'id' AND question->>'id' != '' THEN
            q_id := (question->>'id')::uuid;
            UPDATE public.poll_questions
            SET
                question_text = question->>'question_text',
                question_type = question->>'question_type',
                question_order = (question->>'question_order')::int
            WHERE id = q_id;
        ELSE
            INSERT INTO public.poll_questions (poll_id, question_text, question_type, question_order)
            VALUES (
                poll_id,
                question->>'question_text',
                question->>'question_type',
                (question->>'question_order')::int
            ) RETURNING id INTO q_id;
        END IF;

        -- Upsert options
        IF question->>'question_type' = 'multiple_choice' THEN
            FOR option IN SELECT * FROM jsonb_array_elements(question->'options')
            LOOP
                IF option ? 'id' AND option->>'id' != '' THEN
                    o_id := (option->>'id')::uuid;
                    UPDATE public.poll_options
                    SET
                        option_text = option->>'option_text',
                        option_order = (option->>'option_order')::int
                    WHERE id = o_id;
                ELSE
                    INSERT INTO public.poll_options (question_id, option_text, option_order)
                    VALUES (
                        q_id,
                        option->>'option_text',
                        (option->>'option_order')::int
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    RETURN poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for getting poll results
CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p.id),
        'genderDistribution', (
            SELECT jsonb_agg(jsonb_build_object('name', COALESCE(u.gender, 'Unknown'), 'value', COUNT(DISTINCT pr.user_id)))
            FROM poll_responses pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.poll_id = p.id
            GROUP BY COALESCE(u.gender, 'Unknown')
        ),
        'questions', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'text', q.question_text,
                    'answers', (
                        SELECT jsonb_agg(jsonb_build_object('name', po.option_text, 'value', COUNT(pr.id)))
                        FROM poll_options po
                        LEFT JOIN poll_responses pr ON pr.option_id = po.id
                        WHERE po.question_id = q.id
                        GROUP BY po.option_text
                    )
                )
            )
            FROM poll_questions q
            WHERE q.poll_id = p.id
        )
    )
    INTO result
    FROM polls p
    WHERE p.id = p_poll_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for user-facing polls list
CREATE OR REPLACE FUNCTION public.get_active_polls_for_user(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    is_active boolean,
    active_until timestamptz,
    created_at timestamptz,
    response_count bigint,
    user_has_voted boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.description,
        p.is_active,
        p.active_until,
        p.created_at,
        (SELECT COUNT(DISTINCT pr.user_id) FROM public.poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        CASE
            WHEN p_user_id IS NULL THEN false
            ELSE EXISTS(SELECT 1 FROM public.poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id)
        END as user_has_voted
    FROM public.polls p
    WHERE p.is_active = true AND (p.active_until IS NULL OR p.active_until > now())
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- Function for submitting a poll response
CREATE OR REPLACE FUNCTION public.submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void AS $$
DECLARE
    answer jsonb;
BEGIN
    -- Check if user has already voted
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
    END IF;

    -- Insert answers
    FOR answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (p_poll_id, (answer->>'questionId')::uuid, (answer->>'optionId')::uuid, p_user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- Function for getting support ticket stats
CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE(
    total bigint,
    open bigint,
    in_progress bigint,
    resolved bigint,
    closed bigint,
    avg_resolution_hours numeric
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed,
        AVG(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
        ) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
    FROM support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
GRANT EXECUTE ON FUNCTION public.handle_new_rating(uuid, uuid, int, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activities(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_polls_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_poll_response(uuid, uuid, jsonb) TO authenticated;

-- GRANT PERMISSIONS TO ANON ROLE
GRANT EXECUTE ON FUNCTION public.get_reviews_for_leader(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_polls_for_user(uuid) TO anon, authenticated;


COMMIT;
