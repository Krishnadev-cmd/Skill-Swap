-- Create connections table for user-to-user connections
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Prevent users from connecting to themselves
  CONSTRAINT no_self_connection CHECK (requester_id != receiver_id),
  
  -- Prevent duplicate connection requests between the same users for the same skill
  UNIQUE(requester_id, receiver_id, skill_id)
);

-- Create indexes for better performance
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_receiver ON connections(receiver_id);
CREATE INDEX idx_connections_skill ON connections(skill_id);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_created_at ON connections(created_at);

-- Enable Row Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can view connections where they are either requester or receiver
CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

-- Users can create connection requests (as requester)
CREATE POLICY "Users can create connection requests" ON connections
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND
        requester_id != receiver_id
    );

-- Users can update connections where they are the receiver (accept/reject)
-- Or where they are the requester (to cancel pending requests)
CREATE POLICY "Users can update their connections" ON connections
    FOR UPDATE USING (
        auth.uid() = receiver_id OR 
        (auth.uid() = requester_id AND status = 'pending')
    );

-- Users can delete their own connection requests or accepted connections
CREATE POLICY "Users can delete their connections" ON connections
    FOR DELETE USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_updated_at();

-- Optional: Create a view for easier querying with user details
CREATE VIEW connection_details AS
SELECT 
    c.*,
    s.name as skill_name,
    s.category as skill_category,
    s.level as skill_level,
    requester_profiles.full_name as requester_name,
    requester_profiles.email as requester_email,
    requester_profiles.avatar_url as requester_avatar,
    receiver_profiles.full_name as receiver_name,
    receiver_profiles.email as receiver_email,
    receiver_profiles.avatar_url as receiver_avatar
FROM connections c
LEFT JOIN skills s ON c.skill_id = s.id
LEFT JOIN profiles requester_profiles ON c.requester_id = requester_profiles.id
LEFT JOIN profiles receiver_profiles ON c.receiver_id = receiver_profiles.id;

-- Grant access to the view
GRANT SELECT ON connection_details TO authenticated;
