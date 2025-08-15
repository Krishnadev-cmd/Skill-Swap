import Image from "next/image";
import { createClient } from '@/utils/supabase/server'
import AppLayout from '@/components/AppLayout'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user stats if logged in
  let userStats = {
    skillsCount: 0,
    connectionsCount: 0
  }

  if (user) {
    try {
      // Fetch user's skills count
      const { data: skills } = await supabase
        .from('skills')
        .select('id')
        .eq('user_id', user.id)

      // Fetch user's connections count (accepted connections only)
      const { data: connections } = await supabase
        .from('connections')
        .select('id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted')

      userStats.skillsCount = skills?.length || 0
      userStats.connectionsCount = connections?.length || 0
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {user ? (
            // Logged in user content
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}! 🎉
                </h1>
                <p className="text-xl text-gray-600">Ready to share your skills and learn something new?</p>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn New Skills</h3>
                  <p className="text-gray-600 mb-4">Discover skills you want to learn from the community</p>
                  <a href="/browse" className="text-blue-600 hover:text-blue-500 font-medium">
                    Browse Skills →
                  </a>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Skills</h3>
                  <p className="text-gray-600 mb-4">Teach others what you know and earn skill credits</p>
                  <a href="/my-skills" className="text-green-600 hover:text-green-500 font-medium">
                    Manage Skills →
                  </a>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect & Chat</h3>
                  <p className="text-gray-600 mb-4">Message other skill swappers and arrange exchanges</p>
                  <a href="/messages" className="text-purple-600 hover:text-purple-500 font-medium">
                    View Messages →
                  </a>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Skill Swap Journey</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{userStats.skillsCount}</div>
                    <div className="text-gray-600">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{userStats.connectionsCount}</div>
                    <div className="text-gray-600">Connections Made</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Not logged in content
            <div className="text-center">
              <Image
                className="dark:invert mx-auto mb-8"
                src="/next.svg"
                alt="Next.js logo"
                width={180}
                height={38}
                priority
              />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Skill Swap</h1>
              <p className="text-xl text-gray-600 mb-8">Exchange skills and learn from the community</p>
              
              <a
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                href="/login"
              >
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
