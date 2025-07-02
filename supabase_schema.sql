-- Enable the "citext" extension for case-insensitive text.
-- This is used for email addresses to prevent duplicates.
create extension if not exists citext with schema public;

-- Enable the "pg_cron" extension for scheduled tasks.
create extension if not exists pg_cron with schema extensions;

-- Function to create a public user profile when a new auth user signs up
-- This is now idempotent, it will not fail if the user already exists.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if a profile already exists for the new user
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- If not, insert a new profile
    insert into public.users (id, email, name)
    values (new.id, new.email, new.raw_user_meta_data->>'name');
  END IF;
  return new;
end;
$$;

-- Trigger to call the function after a new user is added to auth.users
-- This ensures that if the trigger runs again for some reason, it won't cause an error.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- New RPC function to be called from the client after login if profile is missing
create or replace function public.ensure_user_profile_exists()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  auth_user_id uuid := auth.uid();
  auth_user_email text := (select email from auth.users where id = auth_user_id);
  auth_user_name text := (select raw_user_meta_data->>'name' from auth.users where id = auth_user_id);
begin
  if not exists (select 1 from public.users where id = auth_user_id) then
    insert into public.users (id, email, name)
    values (auth_user_id, auth_user_email, auth_user_name);
  end if;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.ensure_user_profile_exists() to authenticated;


-- Define the 'users' table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY,
    email public.citext UNIQUE,
    name text,
    gender text,
    age integer,
    "createdAt" timestamp with time zone DEFAULT now(),
    "isBlocked" boolean DEFAULT false,
    "blockedUntil" timestamp with time zone,
    "blockReason" text,
    state text,
    "mpConstituency" text,
    "mlaConstituency" text,
    panchayat text
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Define the 'leaders' table
CREATE TABLE IF NOT EXISTS public.leaders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "partyName" text,
    gender text,
    age integer,
    "photoUrl" text,
    constituency text,
    "nativeAddress" text,
    "electionType" text,
    location jsonb,
    rating real DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "previousElections" jsonb,
    "manifestoUrl" text,
    "twitterUrl" text,
    "addedByUserId" uuid,
    "createdAt" timestamp with time zone DEFAULT now(),
    status public.citext DEFAULT 'pending'::public.citext NOT NULL,
    "adminComment" text,
    CONSTRAINT leaders_addedByUserId_fkey FOREIGN KEY ("addedByUserId") REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to view approved leaders" ON public.leaders FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow authenticated users to add leaders" ON public.leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow owner to update their submitted leader" ON public.leaders FOR UPDATE USING (auth.uid() = "addedByUserId");

-- Define the 'ratings' table
CREATE TABLE IF NOT EXISTS public.ratings (
    "leaderId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    "socialBehaviour" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("leaderId", "userId"),
    CONSTRAINT ratings_leaderId_fkey FOREIGN KEY ("leaderId") REFERENCES public.leaders(id) ON DELETE CASCADE,
    CONSTRAINT ratings_userId_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Allow users to insert/update their own ratings" ON public.ratings FOR ALL USING (auth.uid() = "userId");

-- Define the 'admin_messages' table
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to view their own messages" ON public.admin_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow user to mark their messages as read" ON public.admin_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Define the 'site_settings' table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id smallint PRIMARY KEY DEFAULT 1,
    maintenance_active text,
    maintenance_start text,
    maintenance_end text,
    maintenance_message text,
    contact_email text,
    contact_phone text,
    contact_twitter text,
    contact_linkedin text,
    contact_youtube text,
    contact_facebook text,
    CONSTRAINT site_settings_id_check CHECK (id = 1)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to read site settings" ON public.site_settings FOR SELECT USING (true);

-- Define the 'notifications' table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    message text NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    link text
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to view notifications" ON public.notifications FOR SELECT USING (true);

-- Define the 'support_tickets' table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    user_name text NOT NULL,
    user_email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    admin_notes text,
    CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- Polls System Tables
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT false,
    active_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to active polls" ON public.polls FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.poll_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL, -- 'yes_no' or 'multiple_choice'
    question_order integer
);
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to questions of active polls" ON public.poll_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id AND is_active = true)
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    option_order integer
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to options of active poll questions" ON public.poll_options FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.poll_questions pq JOIN public.polls p ON pq.poll_id = p.id WHERE pq.id = question_id AND p.is_active = true)
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(poll_id, question_id, user_id)
);
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own responses" ON public.poll_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert responses" ON public.poll_responses FOR INSERT WITH CHECK (auth.uid() = user_id);


-- DB Functions

CREATE OR REPLACE FUNCTION public.update_leader_rating(leader_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_rating REAL;
    review_count_val INT;
BEGIN
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count_val
    FROM public.ratings
    WHERE "leaderId" = leader_id_param;

    UPDATE public.leaders
    SET 
        rating = COALESCE(avg_rating, 0),
        "reviewCount" = COALESCE(review_count_val, 0)
    WHERE id = leader_id_param;
END;
$$;

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
    INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "updatedAt")
    VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now())
    ON CONFLICT ("leaderId", "userId")
    DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        "socialBehaviour" = EXCLUDED."socialBehaviour",
        "updatedAt" = now();
    
    PERFORM public.update_leader_rating(p_leader_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_rating_deletion(p_user_id uuid, p_leader_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.ratings
    WHERE "userId" = p_user_id AND "leaderId" = p_leader_id;
    
    PERFORM public.update_leader_rating(p_leader_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reviews_for_leader(p_leader_id uuid)
RETURNS TABLE (
    "userName" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    "socialBehaviour" text
)
LANGUAGE sql
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_user_activities(p_user_id uuid)
RETURNS TABLE (
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    leader jsonb,
    "socialBehaviour" text,
    "userName" text
)
LANGUAGE sql
AS $$
    SELECT
        r."leaderId",
        l.name as "leaderName",
        l."photoUrl" as "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) as leader,
        r."socialBehaviour",
        u.name as "userName"
    FROM public.ratings r
    JOIN public.leaders l ON r."leaderId" = l.id
    JOIN public.users u ON r."userId" = u.id
    WHERE r."userId" = p_user_id
    ORDER BY r."updatedAt" DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_all_activities()
RETURNS TABLE (
    "leaderId" uuid,
    "leaderName" text,
    "leaderPhotoUrl" text,
    rating int,
    comment text,
    "updatedAt" timestamptz,
    leader jsonb,
    "socialBehaviour" text,
    "userName" text
)
LANGUAGE sql
AS $$
    SELECT
        r."leaderId",
        l.name as "leaderName",
        l."photoUrl" as "leaderPhotoUrl",
        r.rating,
        r.comment,
        r."updatedAt",
        row_to_json(l) as leader,
        r."socialBehaviour",
        u.name as "userName"
    FROM public.ratings r
    JOIN public.leaders l ON r."leaderId" = l.id
    JOIN public.users u ON r."userId" = u.id
    ORDER BY r."updatedAt" DESC;
$$;

CREATE OR REPLACE FUNCTION public.upsert_poll(poll_data jsonb)
RETURNS uuid AS $$
DECLARE
    poll_id uuid;
    q jsonb;
    o jsonb;
    question_id uuid;
BEGIN
    -- Upsert poll
    IF poll_data->>'id' = '' THEN
        INSERT INTO polls (title, description, is_active, active_until)
        VALUES (poll_data->>'title', poll_data->>'description', (poll_data->>'is_active')::boolean, (poll_data->>'active_until')::timestamptz)
        RETURNING id INTO poll_id;
    ELSE
        poll_id := (poll_data->>'id')::uuid;
        UPDATE polls
        SET title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = poll_id;
    END IF;

    -- Delete old questions/options not in the new payload
    DELETE FROM poll_questions WHERE poll_id = poll_id AND id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(poll_data->'questions') WHERE value->>'id' != '');
    
    -- Loop through questions
    FOR q IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        -- Upsert question
        IF q->>'id' = '' THEN
            INSERT INTO poll_questions (poll_id, question_text, question_type, question_order)
            VALUES (poll_id, q->>'question_text', q->>'question_type', (q->>'question_order')::int)
            RETURNING id INTO question_id;
        ELSE
            question_id := (q->>'id')::uuid;
            UPDATE poll_questions
            SET question_text = q->>'question_text',
                question_type = q->>'question_type',
                question_order = (q->>'question_order')::int
            WHERE id = question_id;
        END IF;

        -- Delete old options
        DELETE FROM poll_options WHERE question_id = question_id AND id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(q->'options') WHERE value->>'id' != '');

        -- Loop through options
        FOR o IN SELECT * FROM jsonb_array_elements(q->'options')
        LOOP
            IF o->>'id' = '' THEN
                 INSERT INTO poll_options (question_id, option_text, option_order)
                 VALUES (question_id, o->>'option_text', (o->>'option_order')::int);
            ELSE
                 UPDATE poll_options
                 SET option_text = o->>'option_text',
                     option_order = (o->>'option_order')::int
                 WHERE id = (o->>'id')::uuid;
            END IF;
        END LOOP;
    END LOOP;

    RETURN poll_id;
END;
$$ LANGUAGE plpgsql;

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
        (SELECT COUNT(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        EXISTS(SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id::text) as is_promoted
    FROM polls p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_poll_results(p_poll_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p.id),
        'genderDistribution', (
            SELECT COALESCE(jsonb_agg(gd), '[]'::jsonb)
            FROM (
                SELECT COALESCE(u.gender, 'Unknown') as name, COUNT(DISTINCT pr.user_id) as value
                FROM poll_responses pr
                JOIN users u ON pr.user_id = u.id
                WHERE pr.poll_id = p.id
                GROUP BY u.gender
            ) gd
        ),
        'questions', (
            SELECT jsonb_agg(q_res)
            FROM (
                SELECT
                    q.id,
                    q.question_text as text,
                    (
                        SELECT jsonb_agg(o_res)
                        FROM (
                            SELECT
                                o.option_text as name,
                                COUNT(pr.id) as value
                            FROM poll_options o
                            LEFT JOIN poll_responses pr ON o.id = pr.option_id
                            WHERE o.question_id = q.id
                            GROUP BY o.option_text
                            ORDER BY o.option_text
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
        (SELECT COUNT(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        CASE WHEN p_user_id IS NULL THEN false ELSE EXISTS(SELECT 1 FROM poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id) END as user_has_voted
    FROM polls p
    WHERE p.is_active = true
    AND (p.active_until IS NULL OR p.active_until > now())
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void AS $$
DECLARE
    answer jsonb;
    has_voted boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) INTO has_voted;
    IF has_voted THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
    END IF;

    FOR answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO poll_responses (poll_id, question_id, option_id, user_id)
        VALUES (p_poll_id, (answer->>'questionId')::uuid, (answer->>'optionId')::uuid, p_user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE(total bigint, open bigint, in_progress bigint, resolved bigint, closed bigint, avg_resolution_hours double precision) AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE status = 'open') AS open,
    count(*) FILTER (WHERE status = 'in-progress') AS in_progress,
    count(*) FILTER (WHERE status = 'resolved') AS resolved,
    count(*) FILTER (WHERE status = 'closed') AS closed,
    avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
  FROM support_tickets;
END;
$$ LANGUAGE plpgsql;


-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

GRANT EXECUTE ON FUNCTION public.handle_new_rating(uuid,uuid,int,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_leader(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activities(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_poll_response(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_polls_for_user(uuid) TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
