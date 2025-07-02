--
-- Supabase schema for PolitiRate
-- This script sets up all tables, relationships, security policies, and database functions.
-- It is designed to be run in the Supabase SQL Editor.
--

--
-- ========= EXTENSIONS AND HELPER FUNCTIONS =========
--
-- Create a helper function to check if a user is an admin.
-- For this prototype, we'll hardcode the admin email.
-- In a production app, you might use a roles table or custom claims.
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    RETURN user_email = 'admin@politirate.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--
-- ========= ENUM TYPES =========
--
-- Create custom types (ENUMs) for specific fields to ensure data consistency.
DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE election_type_enum AS ENUM ('national', 'state', 'panchayat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leader_status_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE election_status_enum AS ENUM ('winner', 'loser');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE poll_question_type_enum AS ENUM ('yes_no', 'multiple_choice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('open', 'in-progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--
-- ========= TABLES =========
--

-- Table for Users
-- Connects to Supabase's built-in `auth.users` table.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    gender gender_enum,
    age INTEGER,
    state TEXT,
    mp_constituency TEXT,
    mla_constituency TEXT,
    panchayat TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    block_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE users IS 'User profile information, linked to Firebase Auth users.';

-- Table for Leaders
CREATE TABLE IF NOT EXISTS leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    party_name TEXT NOT NULL,
    gender gender_enum NOT NULL,
    age INTEGER NOT NULL,
    photo_url TEXT,
    constituency TEXT NOT NULL,
    native_address TEXT NOT NULL,
    election_type election_type_enum NOT NULL,
    location JSONB, -- For storing state and district
    rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    previous_elections JSONB,
    manifesto_url TEXT,
    twitter_url TEXT,
    status leader_status_enum DEFAULT 'pending',
    added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE leaders IS 'Stores information about political leaders.';

-- Table for Reviews (replaces separate ratings and comments tables)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    social_behaviour TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, leader_id) -- Each user can only review a leader once
);
COMMENT ON TABLE reviews IS 'Stores user ratings and comments for leaders.';

-- Table for Site-wide Settings
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);
COMMENT ON TABLE site_settings IS 'Key-value store for global site configuration.';

-- Table for Site Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE notifications IS 'Stores site-wide announcement banners.';

-- Tables for Polls
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    active_until TIMESTAMPTZ,
    response_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE polls IS 'Main table for polls and surveys.';

CREATE TABLE IF NOT EXISTS poll_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type poll_question_type_enum NOT NULL,
    question_order INTEGER
);
COMMENT ON TABLE poll_questions IS 'Individual questions within a poll.';

CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES poll_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER,
    vote_count INTEGER DEFAULT 0
);
COMMENT ON TABLE poll_options IS 'Answer options for a poll question.';

CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(poll_id, user_id) -- User can only respond once per poll
);
COMMENT ON TABLE poll_responses IS 'Tracks which user has responded to which poll.';

CREATE TABLE IF NOT EXISTS poll_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES poll_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES poll_questions(id) ON DELETE CASCADE,
    selected_option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE
);
COMMENT ON TABLE poll_answers IS 'Stores the specific answers for a user''s poll response.';

-- Table for Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status ticket_status_enum DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    admin_notes TEXT
);
COMMENT ON TABLE support_tickets IS 'Stores user inquiries from the contact form.';

-- **NEW** Table for Admin Messages
CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE admin_messages IS 'Stores messages/warnings sent from admins to specific users.';

--
-- ========= ROW LEVEL SECURITY (RLS) POLICIES =========
--
-- Enable RLS on all tables by default.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;


-- Policies for `users` table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all user profiles" ON users FOR ALL USING (is_admin(auth.uid()));

-- Policies for `leaders` table
CREATE POLICY "Anyone can view approved leaders" ON leaders FOR SELECT USING (status = 'approved');
CREATE POLICY "Authenticated users can submit new leaders" ON leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update leaders they submitted (if pending)" ON leaders FOR UPDATE USING (auth.uid() = added_by_user_id AND status = 'pending');
CREATE POLICY "Admins can manage all leaders" ON leaders FOR ALL USING (is_admin(auth.uid()));

-- Policies for `reviews` table
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any review" ON reviews FOR DELETE USING (is_admin(auth.uid()));

-- Policies for `site_settings`, `notifications`, `support_tickets`
CREATE POLICY "Anyone can read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON site_settings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage support tickets" ON support_tickets FOR ALL USING (is_admin(auth.uid()));

-- **NEW** Policies for `admin_messages` table
CREATE POLICY "Admins can manage all messages" ON admin_messages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view and update their own messages" ON admin_messages FOR ALL USING (user_id = auth.uid());


-- Policies for `polls` and related tables
CREATE POLICY "Anyone can view active polls and questions/options" ON polls FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view poll questions and options" ON poll_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage all poll data" ON polls FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage poll questions" ON poll_questions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage poll options" ON poll_options FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can submit poll responses" ON poll_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can submit poll answers" ON poll_answers FOR INSERT WITH CHECK (
    (SELECT user_id FROM poll_responses WHERE id = response_id) = auth.uid()
);
CREATE POLICY "Admins can view all poll responses and answers" ON poll_responses FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all poll answers" ON poll_answers FOR SELECT USING (is_admin(auth.uid()));


--
-- ========= TRIGGERS AND DATABASE FUNCTIONS =========
--

-- Function to update a leader's average rating and review count
CREATE OR REPLACE FUNCTION update_leader_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_rating NUMERIC;
    new_review_count INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(id)
    INTO new_rating, new_review_count
    FROM reviews
    WHERE leader_id = NEW.leader_id;

    UPDATE leaders
    SET rating = new_rating,
        review_count = new_review_count
    WHERE id = NEW.leader_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after a review is inserted or updated
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_leader_rating();


-- Function to handle creating a user profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is added to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

--
-- ========= SEED DATA (Optional) =========
--
-- Insert default site settings if they don't exist
INSERT INTO site_settings (key, value, description) VALUES
    ('maintenance_active', 'false', 'Is the site currently in maintenance mode? (true/false)'),
    ('maintenance_message', 'The site is currently down for maintenance. We will be back shortly.', 'Message to display during maintenance.'),
    ('contact_email', 'support@politirate.com', 'Public support email address.'),
    ('contact_phone', '', 'Public support phone number.'),
    ('contact_twitter', '', 'X/Twitter profile URL.'),
    ('contact_linkedin', '', 'LinkedIn profile URL.'),
    ('contact_youtube', '', 'YouTube channel URL.'),
    ('contact_facebook', '', 'Facebook page URL.')
ON CONFLICT (key) DO NOTHING;
