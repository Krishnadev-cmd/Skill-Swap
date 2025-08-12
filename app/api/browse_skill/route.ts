import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Current user ID:', user.id)

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    console.log('Search params:', { search, category, level, page, limit })

    // First, let's see ALL skills in the database
    const { data: allSkills, error: allSkillsError } = await supabase
      .from('skills')
      .select('*')

    console.log('All skills in database:', allSkills)
    console.log('All skills error:', allSkillsError)

    // Let's see what skills should be visible to this user
    const otherUsersSkills = allSkills?.filter(skill => skill.user_id !== user.id) || []
    console.log('Skills from other users (should be visible):', otherUsersSkills)

    // Build the query - use explicit join syntax instead of automatic relationship
    let query = supabase
      .from('skills')
      .select(`
        id,
        name,
        category,
        level,
        description,
        created_at,
        user_id
      `)
      .neq('user_id', user.id) // Don't show current user's skills

    console.log('Query built, filtering OUT current user skills. Current user:', user.id)

    // Let's test a simple query first to see if it works
    const { data: testSkills, error: testError } = await supabase
      .from('skills')
      .select('*')
      .neq('user_id', user.id)
    
    console.log('Simple test query - skills:', testSkills)
    console.log('Simple test query - error:', testError)

    // Let's also test if we can see skills at all (ignoring RLS temporarily)
    const { data: allSkillsTest, error: allSkillsTestError } = await supabase
      .from('skills')
      .select('*')
    
    console.log('All skills test (should show all if RLS allows):', allSkillsTest)
    console.log('All skills test error:', allSkillsTestError)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (level) {
      query = query.eq('level', level)
    }

    // Apply pagination and ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: skills, error } = await query

    console.log('Query result - skills:', skills)
    console.log('Query result - error:', error)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
    }

    // Transform the data and try to fetch user profiles, with fallback
    const transformedSkills = await Promise.all(
      (skills || []).map(async (skill) => {
        let userInfo = {
          id: skill.user_id,
          email: 'unknown@example.com',
          full_name: `User ${skill.user_id.slice(0, 8)}`,
          avatar_url: null
        }

        try {
          // Try to fetch profile from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', skill.user_id)
            .single()

          if (profile && !profileError) {
            userInfo = {
              id: skill.user_id,
              email: profile.email || 'unknown@example.com',
              full_name: profile.full_name || profile.email?.split('@')[0] || `User ${skill.user_id.slice(0, 8)}`,
              avatar_url: profile.avatar_url
            }
          }
        } catch (error) {
          console.log('Profile fetch failed, using fallback for user:', skill.user_id)
        }

        return {
          ...skill,
          user: userInfo
        }
      })
    )

    console.log('Transformed skills with user data:', transformedSkills)

    // Get total count for pagination
    let countQuery = supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .neq('user_id', user.id)

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (category) {
      countQuery = countQuery.eq('category', category)
    }
    if (level) {
      countQuery = countQuery.eq('level', level)
    }

    const { count } = await countQuery

    return NextResponse.json({
      skills: transformedSkills || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit
      }
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}