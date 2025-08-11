import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user:', error)
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
