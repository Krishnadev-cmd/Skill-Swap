-- Simple profiles table creation
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy - everyone can read profiles
CREATE POLICY "Everyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Manually insert current users (you'll need to run this for each user)
-- Replace the UUIDs with your actual user IDs from the logs
INSERT INTO profiles (id, email, full_name) VALUES 
  ('9b374aeb-d3ce-49a7-91e9-e974032de6fd', 'user1@example.com', 'User One'),
  ('b8c48c80-d3fb-4e84-9d88-057a4ead6e3b', 'user2@example.com', 'User Two')
ON CONFLICT (id) DO NOTHING;
