// File: app/auth/callback/route.js
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        console.log('Auth successful, user:', data.user?.email)
        
        // Create response with proper redirect
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalhost = request.headers.get('host')?.includes('localhost')
        
        // Use the correct base URL
        const baseUrl = isLocalhost 
          ? 'http://localhost:3000' 
          : `https://${forwardedHost || 'skill-swap-kdisop2003-gmailcoms-projects.vercel.app'}`
        
        return NextResponse.redirect(`${baseUrl}${next}`)
      } else {
        console.error('Auth error:', error)
        // If it's a PKCE error, redirect to login to restart the flow
        if (error && error.message.includes('code verifier')) {
          return NextResponse.redirect(`${origin}/login?error=pkce_failed`)
        }
      }
    } catch (error) {
      console.error('Auth exchange error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  // Redirect to login page if code is missing
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}