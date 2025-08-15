import AppLayout from '@/components/AppLayout'
import UserAvatar from '@/components/UserAvatar'
import ConnectButton from '@/components/ConnectButton'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UserIcon } from '@heroicons/react/24/outline'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OtherProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Check if current user is authenticated
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !currentUser) {
    redirect('/login')
  }

  // Prevent users from viewing their own profile through this route
  if (currentUser.id === id) {
    redirect('/profile') // Redirect to their own profile page
  }

  // Try to fetch user info from profiles table first, then fallback to skills table
  let targetUser = null
  let userEmail = null
  let userFullName = null
  let userAvatarUrl = null

  // Try profiles table first
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileData) {
    targetUser = { id: id }
    userEmail = profileData.email
    userFullName = profileData.full_name
    userAvatarUrl = profileData.avatar_url
  } else {
    // Fallback: get user info from skills table
    const { data: skillsData } = await supabase
      .from('skills')
      .select('user_id')
      .eq('user_id', id)
      .limit(1)
      .single()

    if (skillsData) {
      targetUser = { id: id }
      userEmail = `User ${id.slice(0, 8)}`
      userFullName = `User ${id.slice(0, 8)}`
      userAvatarUrl = null
    }
  }

  if (!targetUser) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-600">The user profile you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Fetch the target user's skills
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const userSkills = skills || []

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Expert': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
              <div className="flex items-center space-x-6">
                <UserAvatar 
                  avatarUrl={userAvatarUrl}
                  fullName={userFullName}
                  email={userEmail}
                  size="lg"
                />
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {userFullName || userEmail?.split('@')[0] || 'User'}
                  </h1>
                  <p className="text-blue-100 text-lg">{userEmail}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-blue-100 text-sm">Skill Swap Member</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Skills Section */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Skills ({userSkills.length})</h2>
                  </div>

                  {userSkills.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Added</h3>
                      <p className="text-gray-600">This user hasn&apos;t added any skills yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userSkills.map((skill) => (
                        <div key={skill.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg">{skill.name}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getLevelColor(skill.level)}`}>
                              {skill.level}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                              {skill.category}
                            </span>
                          </div>
                          
                          {skill.description && (
                            <p className="text-gray-600 text-sm mb-3">{skill.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Added {new Date(skill.created_at).toLocaleDateString()}
                            </span>
                            <ConnectButton
                              skillId={skill.id}
                              userId={id}
                              skillName={skill.name}
                              userName={userFullName || userEmail || 'User'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Skills</span>
                        <span className="font-semibold text-gray-900">{userSkills.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categories</span>
                        <span className="font-semibold text-gray-900">
                          {new Set(userSkills.map(s => s.category)).size}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expert Level</span>
                        <span className="font-semibold text-gray-900">
                          {userSkills.filter(s => s.level === 'Expert').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                        Send Message
                      </button>
                      <button className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium">
                        View Skills
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}