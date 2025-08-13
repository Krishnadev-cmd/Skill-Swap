'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Skill {
  id: string
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  description?: string
  category?: string
  created_at: string
}

const skillLevels = [
  { value: 'Beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
  { value: 'Intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  { value: 'Advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
  { value: 'Expert', label: 'Expert', color: 'bg-orange-100 text-orange-800' },
]

const skillCategories = [
  'Programming', 'Design', 'Marketing', 'Business', 'Language', 'Music', 'Art', 'Sports', 'Cooking', 'Other'
]

export default function MySkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    skill_name: '',
    skill_level: 'Beginner' as const,
    description: '',
    category: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch skills on component mount
  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/my_skills')
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      } else {
        console.error('Failed to fetch skills')
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.skill_name.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/my_skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newSkill = await response.json()
        setSkills([...skills, newSkill])
        setFormData({ skill_name: '', skill_level: 'Beginner', description: '', category: '' })
        setShowAddForm(false)
      } else {
        const errorData = await response.json()
        console.error('Failed to add skill:', errorData)
        alert(`Failed to add skill: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding skill:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      const response = await fetch(`/api/my_skills?id=${skillId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSkills(skills.filter(skill => skill.id !== skillId))
      } else {
        console.error('Failed to delete skill')
      }
    } catch (error) {
      console.error('Error deleting skill:', error)
    }
  }

  const getLevelColor = (level: string) => {
    return skillLevels.find(l => l.value === level)?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your skills...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Skills</h1>
            <p className="text-xl text-gray-600">Manage and showcase your expertise</p>
          </div>

          {/* Add Skill Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Skill</span>
            </button>
          </div>

          {/* Add Skill Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Skill</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Name *
                    </label>
                    <input
                      type="text"
                      value={formData.skill_name}
                      onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      placeholder="e.g., JavaScript, Guitar, Photography"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Level *
                    </label>
                    <select
                      value={formData.skill_level}
                      onChange={(e) => setFormData({ ...formData, skill_level: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      {skillLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Select category</option>
                      {skillCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    rows={3}
                    placeholder="Describe your experience or what you can teach..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Skill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Skills Grid */}
          {skills.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills added yet</h3>
              <p className="text-gray-600 mb-6">Start building your skill profile by adding your first skill!</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <div key={skill.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(skill.level)}`}>
                        {skillLevels.find(l => l.value === skill.level)?.label}
                      </span>
                    </div>

                    {skill.category && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Category:</span> {skill.category}
                      </div>
                    )}

                    {skill.description && (
                      <p className="text-gray-600 text-sm">{skill.description}</p>
                    )}

                    <div className="text-xs text-gray-500">
                      Added {new Date(skill.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}