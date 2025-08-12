-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own skills" ON skills;

-- Create a new policy that allows users to view all skills (for browsing)
CREATE POLICY "Users can view all skills for browsing" ON skills
    FOR SELECT USING (true);

-- Keep the other policies for insert, update, delete (users can only modify their own)
-- These should already exist, but here they are for reference:

-- DROP POLICY IF EXISTS "Users can insert own skills" ON skills;
-- CREATE POLICY "Users can insert own skills" ON skills
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DROP POLICY IF EXISTS "Users can update own skills" ON skills;  
-- CREATE POLICY "Users can update own skills" ON skills
--     FOR UPDATE USING (auth.uid() = user_id);

-- DROP POLICY IF EXISTS "Users can delete own skills" ON skills;
-- CREATE POLICY "Users can delete own skills" ON skills
--     FOR DELETE USING (auth.uid() = user_id);
