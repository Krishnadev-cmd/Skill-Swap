import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '../login/action'
import AppLayout from '@/components/AppLayout'

export default async function Profile() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-white/20 border-4 border-white/30">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">
                    {user.user_metadata?.full_name || 'Welcome!'}
                  </h1>
                  <p className="text-blue-100 text-lg">{user.email}</p>
                  <p className="text-blue-200 text-sm">
                    Joined {new Date(user.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <p className="text-gray-900">{user.user_metadata?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Provider</label>
                        <p className="text-gray-900 capitalize">{user.app_metadata?.provider || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                        <p className="text-gray-500 font-mono text-sm">{user.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Sign In</label>
                        <p className="text-gray-900">
                          {new Date(user.last_sign_in_at || '').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">My Skills</h2>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500 mb-4">No skills added yet</p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Add Your First Skill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skills Shared</span>
                        <span className="font-semibold text-blue-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skills Learned</span>
                        <span className="font-semibold text-green-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connections</span>
                        <span className="font-semibold text-purple-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Skill Credits</span>
                        <span className="font-semibold text-orange-600">0</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Edit Profile
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      Privacy Settings
                    </button>
                    <form action={signOut}>
                      <button 
                        type="submit"
                        className="w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
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
