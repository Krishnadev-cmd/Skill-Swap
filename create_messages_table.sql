-- Create messages table for chat functionality
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in their connections" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM connections 
            WHERE connections.id = messages.connection_id 
            AND (connections.requester_id = auth.uid() OR connections.receiver_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in their connections" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM connections 
            WHERE connections.id = messages.connection_id 
            AND (connections.requester_id = auth.uid() OR connections.receiver_id = auth.uid())
            AND connections.status = 'accepted'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create updated_at trigger (assuming you have the function already)
-- CREATE TRIGGER update_messages_updated_at BEFORE UPDATE
--     ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
