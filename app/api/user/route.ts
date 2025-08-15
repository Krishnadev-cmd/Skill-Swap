import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session error', details: sessionError.message }, { status: 500 })
    }
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    // Then get the user
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user:', error)
      return NextResponse.json({ error: 'Failed to get user', details: error.message }, { status: 500 })
    }

    if (!user) {
      console.log('No user found despite having session')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('User found:', user.email)
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
