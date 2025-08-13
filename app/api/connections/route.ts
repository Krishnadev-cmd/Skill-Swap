import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's connections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'sent', 'received', 'accepted', 'all'
    const status = searchParams.get('status') || 'all' // 'pending', 'accepted', 'rejected', 'all'

    let query = supabase
      .from('connection_details')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by connection type
    if (type === 'sent') {
      query = query.eq('requester_id', user.id)
    } else if (type === 'received') {
      query = query.eq('receiver_id', user.id)
    } else if (type === 'accepted') {
      query = query.or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).eq('status', 'accepted')
    } else {
      // All connections where user is involved
      query = query.or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: connections, error } = await query

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    return NextResponse.json({ connections })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new connection request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { receiver_id, skill_id, message } = body

    // Validate required fields
    if (!receiver_id) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

    // Prevent self-connection
    if (user.id === receiver_id) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 })
    }

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('id, status')
      .eq('requester_id', user.id)
      .eq('receiver_id', receiver_id)
      .eq('skill_id', skill_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing connection:', checkError)
      return NextResponse.json({ error: 'Failed to check existing connection' }, { status: 500 })
    }

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return NextResponse.json({ error: 'Connection request already sent' }, { status: 409 })
      } else if (existingConnection.status === 'accepted') {
        return NextResponse.json({ error: 'Already connected with this user' }, { status: 409 })
      }
    }

    // Create new connection request
    const { data: connection, error } = await supabase
      .from('connections')
      .insert([{
        requester_id: user.id,
        receiver_id,
        skill_id: skill_id || null,
        message: message || null,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating connection:', error)
      return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Connection request sent successfully',
      connection 
    }, { status: 201 })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update connection status (accept/reject)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connection_id, status } = body

    // Validate required fields
    if (!connection_id || !status) {
      return NextResponse.json({ error: 'Connection ID and status are required' }, { status: 400 })
    }

    // Validate status
    if (!['accepted', 'rejected', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update connection status
    const { data: connection, error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connection_id)
      .eq('receiver_id', user.id) // Only receiver can update status
      .eq('status', 'pending') // Only pending connections can be updated
      .select()
      .single()

    if (error) {
      console.error('Error updating connection:', error)
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: `Connection ${status} successfully`,
      connection 
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel/remove connection
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connection_id = searchParams.get('id')

    if (!connection_id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Delete connection (user must be either requester or receiver)
    const { data: connection, error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connection_id)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .select()
      .single()

    if (error) {
      console.error('Error deleting connection:', error)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Connection deleted successfully' })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
