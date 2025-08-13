import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Fetch messages for a connection
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
    }

    // Verify user has access to this connection
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or access denied' }, { status: 404 })
    }

    // Fetch messages with basic info
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId, content, messageType = 'text' } = await request.json()

    if (!connectionId || !content?.trim()) {
      return NextResponse.json({ error: 'Connection ID and content required' }, { status: 400 })
    }

    // Verify connection exists and user has access
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or not accepted' }, { status: 404 })
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
