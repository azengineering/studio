
-- Full schema for the PolitiRate application.
-- This script is idempotent and can be run multiple times safely.

-- Part 1: Table Creation

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "gender" "text",
    "age" integer,
    "state" "text",
    "mpConstituency" "text",
    "mlaConstituency" "text",
    "panchayat" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "isBlocked" boolean DEFAULT false,
    "blockedUntil" timestamp with time zone,
    "blockReason" "text"
);
ALTER TABLE "public"."users" OWNER TO "postgres";
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."leaders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "partyName" "text",
    "gender" "text" NOT NULL,
    "age" integer NOT NULL,
    "photoUrl" "text",
    "constituency" "text",
    "nativeAddress" "text",
    "electionType" "text",
    "location" "jsonb",
    "rating" numeric(3, 2) DEFAULT 0.00 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "previousElections" "jsonb"[],
    "manifestoUrl" "text",
    "twitterUrl" "text",
    "addedByUserId" "uuid",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "adminComment" "text"
);
ALTER TABLE "public"."leaders" OWNER TO "postgres";
ALTER TABLE ONLY "public"."leaders" ADD CONSTRAINT "leaders_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."leaders" ADD CONSTRAINT "leaders_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "public"."users"(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "leaderId" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "socialBehaviour" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."ratings" OWNER TO "postgres";
ALTER TABLE ONLY "public"."ratings" ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "public"."leaders"(id) ON DELETE CASCADE;
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"(id) ON DELETE CASCADE;
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE "public"."ratings" ADD CONSTRAINT "ratings_userId_leaderId_key" UNIQUE ("userId", "leaderId");


CREATE TABLE IF NOT EXISTS "public"."admin_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."admin_messages" OWNER TO "postgres";
ALTER TABLE ONLY "public"."admin_messages" ADD CONSTRAINT "admin_messages_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."admin_messages" ADD CONSTRAINT "admin_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" integer NOT NULL,
    "maintenance_active" "text" DEFAULT 'false',
    "maintenance_start" timestamp with time zone,
    "maintenance_end" timestamp with time zone,
    "maintenance_message" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "contact_twitter" "text",
    "contact_linkedin" "text",
    "contact_youtube" "text",
    "contact_facebook" "text"
);
ALTER TABLE "public"."site_settings" OWNER TO "postgres";
ALTER TABLE ONLY "public"."site_settings" ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY (id);


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message" "text" NOT NULL,
    "startTime" timestamp with time zone,
    "endTime" timestamp with time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "link" "text"
);
ALTER TABLE "public"."notifications" OWNER TO "postgres";
ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "user_name" "text" NOT NULL,
    "user_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "admin_notes" "text"
);
ALTER TABLE "public"."support_tickets" OWNER TO "postgres";
ALTER TABLE ONLY "public"."support_tickets" ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS "public"."polls" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "active_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."polls" OWNER TO "postgres";
ALTER TABLE ONLY "public"."polls" ADD CONSTRAINT "polls_pkey" PRIMARY KEY ("id");


CREATE TABLE IF NOT EXISTS "public"."poll_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "question_order" integer
);
ALTER TABLE "public"."poll_questions" OWNER TO "postgres";
ALTER TABLE ONLY "public"."poll_questions" ADD CONSTRAINT "poll_questions_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."poll_questions" ADD CONSTRAINT "poll_questions_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES "public"."polls"(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."poll_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_text" "text" NOT NULL,
    "option_order" integer
);
ALTER TABLE "public"."poll_options" OWNER TO "postgres";
ALTER TABLE ONLY "public"."poll_options" ADD CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."poll_options" ADD CONSTRAINT "poll_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES "public"."poll_questions"(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS "public"."poll_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."poll_responses" OWNER TO "postgres";
ALTER TABLE ONLY "public"."poll_responses" ADD CONSTRAINT "poll_responses_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."poll_responses" ADD CONSTRAINT "poll_responses_option_id_fkey" FOREIGN KEY (option_id) REFERENCES "public"."poll_options"(id) ON DELETE CASCADE;
ALTER TABLE "public"."poll_responses" ADD CONSTRAINT "poll_responses_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES "public"."polls"(id) ON DELETE CASCADE;
ALTER TABLE "public"."poll_responses" ADD CONSTRAINT "poll_responses_question_id_fkey" FOREIGN KEY (question_id) REFERENCES "public"."poll_questions"(id) ON DELETE CASCADE;
ALTER TABLE "public"."poll_responses" ADD CONSTRAINT "poll_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."poll_responses" ADD CONSTRAINT "unique_user_response_per_question" UNIQUE ("user_id", "question_id");


-- Part 2: Enable RLS for all tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leaders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."polls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_responses" ENABLE ROW LEVEL SECURITY;

-- Part 3: RLS Policies

-- USERS Table
CREATE POLICY "Allow users to view their own profile" ON "public"."users" FOR SELECT USING ("auth"."uid"() = "id");
CREATE POLICY "Allow users to update their own profile" ON "public"."users" FOR UPDATE USING ("auth"."uid"() = "id") WITH CHECK ("auth"."uid"() = "id");

-- LEADERS Table
CREATE POLICY "Allow anyone to view approved leaders" ON "public"."leaders" FOR SELECT USING ("status" = 'approved');
CREATE POLICY "Allow logged-in users to add new leaders" ON "public"."leaders" FOR INSERT WITH CHECK ("auth"."role"() = 'authenticated');
CREATE POLICY "Allow user to update their own submitted leader" ON "public"."leaders" FOR UPDATE USING (("auth"."uid"() = "addedByUserId")) WITH CHECK (("auth"."uid"() = "addedByUserId"));

-- RATINGS Table
CREATE POLICY "Allow anyone to view ratings" ON "public"."ratings" FOR SELECT USING (true);
CREATE POLICY "Allow logged-in users to insert their own rating" ON "public"."ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "userId") AND ("auth"."role"() = 'authenticated'));
CREATE POLICY "Allow users to update their own rating" ON "public"."ratings" FOR UPDATE USING (("auth"."uid"() = "userId")) WITH CHECK (("auth"."uid"() = "userId"));

-- ADMIN_MESSAGES Table
CREATE POLICY "Allow users to view their own messages" ON "public"."admin_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow users to update their own message to read" ON "public"."admin_messages" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("isRead" = false))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("isRead" = true)));

-- SITE_SETTINGS, NOTIFICATIONS Tables (Publicly readable)
CREATE POLICY "Allow anyone to read site settings" ON "public"."site_settings" FOR SELECT USING (true);
CREATE POLICY "Allow anyone to read notifications" ON "public"."notifications" FOR SELECT USING (true);

-- SUPPORT_TICKETS Table
CREATE POLICY "Allow users to create support tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK (true);

-- POLLS, POLL_QUESTIONS, POLL_OPTIONS (Publicly readable if active)
CREATE POLICY "Allow anyone to see active polls" ON "public"."polls" FOR SELECT USING ((is_active = true));
CREATE POLICY "Allow anyone to see poll questions" ON "public"."poll_questions" FOR SELECT USING (true);
CREATE POLICY "Allow anyone to see poll options" ON "public"."poll_options" FOR SELECT USING (true);

-- POLL_RESPONSES Table
CREATE POLICY "Allow users to insert their own poll responses" ON "public"."poll_responses" FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow users to view their own poll responses" ON "public"."poll_responses" FOR SELECT USING ((auth.uid() = user_id));


-- Part 4: Database Functions

-- Function to create a user profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$;

-- Trigger for the handle_new_user function
CREATE OR REPLACE TRIGGER "on_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW EXECUTE PROCEDURE "public"."handle_new_user"();


-- Function to update leader's average rating and review count
CREATE OR REPLACE FUNCTION "public"."update_leader_rating"()
RETURNS trigger
LANGUAGE "plpgsql"
AS $$
DECLARE
    new_avg_rating NUMERIC;
    new_review_count INT;
BEGIN
    -- Calculate new average rating and review count
    SELECT
        AVG(rating),
        COUNT(id)
    INTO
        new_avg_rating,
        new_review_count
    FROM
        public.ratings
    WHERE
        "leaderId" = NEW."leaderId";

    -- Update the leaders table
    UPDATE
        public.leaders
    SET
        rating = new_avg_rating,
        reviewCount = new_review_count
    WHERE
        id = NEW."leaderId";

    RETURN NEW;
END;
$$;

-- Trigger for rating updates
CREATE OR REPLACE TRIGGER "update_leader_stats_on_rating_change"
AFTER INSERT OR UPDATE OR DELETE ON "public"."ratings"
FOR EACH ROW EXECUTE PROCEDURE "public"."update_leader_rating"();


-- Function to handle new ratings (insert or update)
CREATE OR REPLACE FUNCTION "public"."handle_new_rating"("p_leader_id" "uuid", "p_user_id" "uuid", "p_rating" integer, "p_comment" "text", "p_social_behaviour" "text")
RETURNS "void"
LANGUAGE "plpgsql"
AS $$
BEGIN
    INSERT INTO public.ratings ("leaderId", "userId", rating, comment, "socialBehaviour", "updatedAt")
    VALUES (p_leader_id, p_user_id, p_rating, p_comment, p_social_behaviour, now())
    ON CONFLICT ("userId", "leaderId")
    DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        "socialBehaviour" = EXCLUDED."socialBehaviour",
        "updatedAt" = now();
END;
$$;

-- Function to handle rating deletions and stats update
CREATE OR REPLACE FUNCTION "public"."handle_rating_deletion"("p_user_id" "uuid", "p_leader_id" "uuid")
RETURNS "void"
LANGUAGE "plpgsql"
AS $$
DECLARE
    deleted_leader_id UUID;
BEGIN
    -- Delete the rating
    DELETE FROM public.ratings
    WHERE "userId" = p_user_id AND "leaderId" = p_leader_id
    RETURNING "leaderId" INTO deleted_leader_id;

    -- If a rating was deleted, update the leader's stats
    IF deleted_leader_id IS NOT NULL THEN
        UPDATE public.leaders
        SET
            "rating" = (SELECT COALESCE(AVG(r.rating), 0) FROM public.ratings r WHERE r."leaderId" = deleted_leader_id),
            "reviewCount" = (SELECT COUNT(*) FROM public.ratings r WHERE r."leaderId" = deleted_leader_id)
        WHERE id = deleted_leader_id;
    END IF;
END;
$$;


-- Function to get reviews for a leader
CREATE OR REPLACE FUNCTION "public"."get_reviews_for_leader"("p_leader_id" "uuid")
RETURNS TABLE("userName" "text", "rating" integer, "comment" "text", "updatedAt" timestamp with time zone, "socialBehaviour" "text")
LANGUAGE "plpgsql"
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.name AS "userName",
        r.rating,
        r.comment,
        r. "updatedAt",
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
$$;


-- Function to get activities for a user
CREATE OR REPLACE FUNCTION "public"."get_user_activities"("p_user_id" "uuid")
RETURNS TABLE("leaderId" "uuid", "leaderName" "text", "leaderPhotoUrl" "text", "rating" integer, "comment" "text", "updatedAt" timestamp with time zone, "leader" "json", "socialBehaviour" "text", "userName" "text")
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
  SELECT
      r."leaderId",
      l.name as "leaderName",
      l."photoUrl" as "leaderPhotoUrl",
      r.rating,
      r.comment,
      r."updatedAt",
      json_build_object(
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
          'twitterUrl', l."twitterUrl",
          'addedByUserId', l."addedByUserId",
          'createdAt', l."createdAt",
          'status', l.status,
          'adminComment', l."adminComment"
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
$$;

-- Function to get all activities (for admin)
CREATE OR REPLACE FUNCTION "public"."get_all_activities"()
RETURNS TABLE("leaderId" "uuid", "leaderName" "text", "leaderPhotoUrl" "text", "rating" integer, "comment" "text", "updatedAt" timestamp with time zone, "leader" "json", "socialBehaviour" "text", "userName" "text")
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
  SELECT
      r."leaderId",
      l.name as "leaderName",
      l."photoUrl" as "leaderPhotoUrl",
      r.rating,
      r.comment,
      r."updatedAt",
      json_build_object(
          'id', l.id,
          'name', l.name
      ) as leader,
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
$$;


-- Poll related functions
CREATE OR REPLACE FUNCTION get_admin_polls()
RETURNS TABLE(
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
        (SELECT COUNT(DISTINCT user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        (EXISTS (SELECT 1 FROM notifications n WHERE n.link = '/polls/' || p.id::text)) as is_promoted
    FROM 
        polls p
    ORDER BY 
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_active_polls_for_user(p_user_id uuid)
RETURNS TABLE(
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
        (SELECT COUNT(DISTINCT pr.user_id) FROM poll_responses pr WHERE pr.poll_id = p.id) as response_count,
        (CASE WHEN p_user_id IS NULL THEN false ELSE EXISTS (SELECT 1 FROM poll_responses pr WHERE pr.poll_id = p.id AND pr.user_id = p_user_id) END) as user_has_voted
    FROM 
        polls p
    WHERE
        p.is_active = true AND
        (p.active_until IS NULL OR p.active_until > now())
    ORDER BY 
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION upsert_poll(poll_data jsonb)
RETURNS uuid AS $$
DECLARE
    poll_id uuid;
    question_data jsonb;
    question_id uuid;
    option_data jsonb;
BEGIN
    -- Upsert Poll
    IF poll_data->>'id' IS NOT NULL AND poll_data->>'id' != '' THEN
        poll_id := (poll_data->>'id')::uuid;
        UPDATE polls
        SET 
            title = poll_data->>'title',
            description = poll_data->>'description',
            is_active = (poll_data->>'is_active')::boolean,
            active_until = (poll_data->>'active_until')::timestamptz
        WHERE id = poll_id;
    ELSE
        INSERT INTO polls (title, description, is_active, active_until)
        VALUES (
            poll_data->>'title',
            poll_data->>'description',
            (poll_data->>'is_active')::boolean,
            (poll_data->>'active_until')::timestamptz
        ) RETURNING id INTO poll_id;
    END IF;

    -- Upsert Questions and Options
    FOR question_data IN SELECT * FROM jsonb_array_elements(poll_data->'questions')
    LOOP
        IF question_data->>'id' IS NOT NULL AND question_data->>'id' != '' THEN
            question_id := (question_data->>'id')::uuid;
            UPDATE poll_questions
            SET 
                question_text = question_data->>'question_text',
                question_type = question_data->>'question_type',
                question_order = (question_data->>'question_order')::integer
            WHERE id = question_id;
        ELSE
            INSERT INTO poll_questions (poll_id, question_text, question_type, question_order)
            VALUES (
                poll_id,
                question_data->>'question_text',
                question_data->>'question_type',
                (question_data->>'question_order')::integer
            ) RETURNING id INTO question_id;
        END IF;

        -- Delete old options for this question before upserting new ones
        DELETE FROM poll_options WHERE question_id = question_id AND id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(question_data->'options') WHERE value->>'id' IS NOT NULL);

        FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
        LOOP
            IF option_data->>'id' IS NOT NULL AND option_data->>'id' != '' THEN
                UPDATE poll_options
                SET
                    option_text = option_data->>'option_text',
                    option_order = (option_data->>'option_order')::integer
                WHERE id = (option_data->>'id')::uuid;
            ELSE
                INSERT INTO poll_options (question_id, option_text, option_order)
                VALUES (
                    question_id,
                    option_data->>'option_text',
                    (option_data->>'option_order')::integer
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN poll_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION submit_poll_response(p_poll_id uuid, p_user_id uuid, p_answers jsonb)
RETURNS void AS $$
DECLARE
    answer jsonb;
BEGIN
    -- Check if user has already voted in this poll
    IF EXISTS (SELECT 1 FROM poll_responses WHERE poll_id = p_poll_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User has already voted in this poll.';
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pollTitle', p.title,
        'totalResponses', (SELECT COUNT(DISTINCT user_id) FROM poll_responses WHERE poll_id = p.id),
        'genderDistribution', (
            SELECT jsonb_agg(jsonb_build_object('name', COALESCE(u.gender, 'Unknown'), 'value', COUNT(u.id)))
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
                        SELECT jsonb_agg(
                            jsonb_build_object('name', o.option_text, 'value', o.response_count)
                        )
                        FROM (
                            SELECT po.option_text, COUNT(pr.id) as response_count
                            FROM poll_options po
                            LEFT JOIN poll_responses pr ON pr.option_id = po.id
                            WHERE po.question_id = q.id
                            GROUP BY po.option_text
                            ORDER BY po.option_order
                        ) o
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
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE(
    total bigint,
    open bigint,
    in_progress bigint,
    resolved bigint,
    closed bigint,
    avg_resolution_hours numeric
) AS $$
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
$$ LANGUAGE plpgsql;


-- Part 5: Grant Permissions
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."update_leader_rating"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."handle_new_rating"("p_leader_id" "uuid", "p_user_id" "uuid", "p_rating" integer, "p_comment" "text", "p_social_behaviour" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_rating_deletion"("p_user_id" "uuid", "p_leader_id" "uuid") TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_reviews_for_leader"("p_leader_id" "uuid") TO "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_activities"("p_user_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_all_activities"() TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_admin_polls"() TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_active_polls_for_user"(p_user_id uuid) to "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."upsert_poll"(poll_data jsonb) to "service_role";
GRANT EXECUTE ON FUNCTION "public"."submit_poll_response"(p_poll_id uuid, p_user_id uuid, p_answers jsonb) to "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_poll_results"(p_poll_id uuid) to "service_role";
GRANT EXECUTE ON FUNCTION "public"."get_ticket_stats"() to "service_role";

