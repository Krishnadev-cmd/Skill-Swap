import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's skills
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: skills, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({ error: 'Error fetching skills' }, { status: 500 })
    }

    return NextResponse.json(skills || [])
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new skill
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { skill_name, skill_level, description, category } = body

    if (!skill_name || !skill_level) {
      return NextResponse.json({ error: 'Skill name and level are required' }, { status: 400 })
    }

    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert([
        {
          user_id: user.id,
          name: skill_name.trim(),
          level: skill_level,
          description: description?.trim() || null,
          category: category?.trim() || null,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error adding skill:', error)
      return NextResponse.json({ error: 'Error adding skill' }, { status: 500 })
    }

    return NextResponse.json(newSkill, { status: 201 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a skill
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const skillId = url.searchParams.get('id')

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId)
      .eq('user_id', user.id) // Ensure user can only delete their own skills

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json({ error: 'Error deleting skill' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Skill deleted successfully' })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
