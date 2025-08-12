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

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <p className="text-xs font-medium text-gray-900">
                          {skill.user?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(skill.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                      Connect
                    </button>
                  </div>
                </div>
              ))}
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