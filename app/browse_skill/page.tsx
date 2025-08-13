'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { MagnifyingGlassIcon, FunnelIcon, UserIcon } from '@heroicons/react/24/outline'

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface Skill {
  id: string
  name: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  description?: string
  created_at: string
  user_id: string
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const skillCategories = [
  'All Categories',
  'Programming', 'Design', 'Marketing', 'Business', 'Language', 
  'Music', 'Art', 'Sports', 'Cooking', 'Other'
]

const skillLevels = [
  'All Levels',
  'Beginner', 'Intermediate', 'Advanced', 'Expert'
]

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
    case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Expert': return 'bg-orange-100 text-orange-800 border-orange-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function BrowseSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [connectingSkills, setConnectingSkills] = useState<Set<string>>(new Set())
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [existingConnections, setExistingConnections] = useState<Set<string>>(new Set())
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set())
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set())
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set())

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const fetchExistingConnections = async () => {
    try {
      const response = await fetch('/api/connections?type=all')
      if (response.ok) {
        const data = await response.json()
        
        // Track accepted connections
        const acceptedSkillIds = new Set<string>()
        const acceptedUserIds = new Set<string>()
        
        // Track pending connections  
        const pendingSkillIds = new Set<string>()
        const pendingUserIds = new Set<string>()
        
        data.connections.forEach((conn: any) => {
          if (conn.status === 'accepted') {
            if (conn.skill_id) acceptedSkillIds.add(conn.skill_id)
            if (conn.requester_id) acceptedUserIds.add(conn.requester_id)
            if (conn.receiver_id) acceptedUserIds.add(conn.receiver_id)
          } else if (conn.status === 'pending') {
            if (conn.skill_id) pendingSkillIds.add(conn.skill_id)
            if (conn.requester_id) pendingUserIds.add(conn.requester_id)
            if (conn.receiver_id) pendingUserIds.add(conn.receiver_id)
          }
        })
        
        setExistingConnections(acceptedSkillIds)
        setConnectedUsers(acceptedUserIds)
        setPendingConnections(pendingSkillIds)
        setPendingUsers(pendingUserIds)
      }
    } catch (error) {
      console.error('Error fetching existing connections:', error)
    }
  }

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (selectedCategory !== 'All Categories') params.append('category', selectedCategory)
      if (selectedLevel !== 'All Levels') params.append('level', selectedLevel)
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      console.log('Fetching skills with params:', params.toString())
      const response = await fetch(`/api/browse_skill?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Skills data received:', data)
        // Debug avatar URLs
        data.skills.forEach((skill: Skill) => {
          if (skill.user?.avatar_url) {
            console.log(`Avatar URL for ${skill.user.full_name}:`, skill.user.avatar_url)
          }
        })
        setSkills(data.skills)
        setPagination(data.pagination)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch skills:', response.status, errorData)
        alert(`Failed to fetch skills: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when search changes
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchSkills()
  }, [debouncedSearchTerm, selectedCategory, selectedLevel, currentPage])

  useEffect(() => {
    fetchExistingConnections()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchSkills()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All Categories')
    setSelectedLevel('All Levels')
    setCurrentPage(1)
  }

  const handleImageError = (skillId: string) => {
    setFailedImages(prev => new Set(prev).add(skillId))
  }

  const handleConnect = async (skill: Skill) => {
    setSelectedSkill(skill)
    setShowConnectModal(true)
  }

  const sendConnectionRequest = async (message: string = '') => {
    if (!selectedSkill) return

    setConnectingSkills(prev => new Set(prev).add(selectedSkill.id))
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: selectedSkill.user?.id,
          skill_id: selectedSkill.id,
          message: message.trim() || null
        })
      })

      if (response.ok) {
        alert(`Connection request sent to ${selectedSkill.user?.full_name || 'user'}!`)
        setShowConnectModal(false)
        setSelectedSkill(null)
        // Refresh existing connections to update button states
        await fetchExistingConnections()
      } else {
        const errorData = await response.json()
        alert(`Failed to send connection request: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      alert('Network error. Please try again.')
    } finally {
      setConnectingSkills(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedSkill.id)
        return newSet
      })
    }
  }

  const getConnectionButtonState = (skill: Skill) => {
    const isConnecting = connectingSkills.has(skill.id)
    const hasAcceptedSkillConnection = existingConnections.has(skill.id)
    const hasAcceptedUserConnection = connectedUsers.has(skill.user?.id || '')
    const hasPendingSkillConnection = pendingConnections.has(skill.id)
    const hasPendingUserConnection = pendingUsers.has(skill.user?.id || '')
    
    if (isConnecting) {
      return { text: 'Connecting...', disabled: true, className: 'bg-blue-50 text-blue-600' }
    } else if (hasAcceptedSkillConnection || hasAcceptedUserConnection) {
      return { text: 'Connected', disabled: true, className: 'bg-green-50 text-green-600' }
    } else if (hasPendingSkillConnection || hasPendingUserConnection) {
      return { text: 'Pending', disabled: true, className: 'bg-yellow-50 text-yellow-600' }
    } else {
      return { text: 'Connect', disabled: false, className: 'bg-blue-50 text-blue-600 hover:bg-blue-100' }
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading && skills.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Skills</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing skills from our community and connect with talented individuals who can help you learn and grow.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skills, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                {searchTerm !== debouncedSearchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Filters Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </button>
              
              {(selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels') && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    {skillCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          {pagination && (
            <div className="mb-6">
              <p className="text-gray-600">
                Found {pagination.totalItems} skills 
                {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
                {selectedLevel !== 'All Levels' && ` at ${selectedLevel} level`}
              </p>
            </div>
          )}

          {/* Skills Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No skills found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse different categories.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Skill Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.category}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>

                  {/* Description */}
                  {skill.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{skill.description}</p>
                  )}

                  {/* User Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {skill.user?.avatar_url && !failedImages.has(skill.id) ? (
                        <img
                          src={skill.user.avatar_url}
                          alt={skill.user.full_name || 'User avatar'}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={() => handleImageError(skill.id)}
                          onLoad={() => console.log('Image loaded successfully for:', skill.user?.full_name)}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {skill.user?.full_name ? 
                            getInitials(skill.user.full_name) : 
                            <UserIcon className="h-4 w-4" />
                          }
                        </div>
                      )}
                      <div>
                        <a 
                          href={`/other_profile/${skill.user?.id}`}
                          className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200"
                        >
                          {skill.user?.full_name || 'User'}
                        </a>
                        <p className="text-xs text-gray-500">
                          {new Date(skill.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleConnect(skill)}
                      disabled={getConnectionButtonState(skill).disabled}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getConnectionButtonState(skill).className}`}
                    >
                      {getConnectionButtonState(skill).text}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connection Modal */}
          {showConnectModal && selectedSkill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Connect with {selectedSkill.user?.full_name || 'User'}
                </h3>
                
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedSkill.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                        {selectedSkill.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(selectedSkill.level)}`}>
                        {selectedSkill.level}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    id="connection-message"
                    placeholder="Hi! I'm interested in learning about this skill. Would you like to connect?"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowConnectModal(false)
                      setSelectedSkill(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const messageInput = document.getElementById('connection-message') as HTMLTextAreaElement
                      sendConnectionRequest(messageInput?.value || '')
                    }}
                    disabled={connectingSkills.has(selectedSkill.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectingSkills.has(selectedSkill.id) ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const page = i + Math.max(1, currentPage - 2)
                if (page > pagination.totalPages) return null
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}