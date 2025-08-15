'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { 
  UserIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  ChatBubbleLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  skill_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
  message: string
  created_at: string
  updated_at: string
  skill_name: string
  skill_category: string
  skill_level: string
  requester_name: string
  requester_email: string
  requester_avatar: string
  receiver_name: string
  receiver_email: string
  receiver_avatar: string
}

type TabType = 'received' | 'sent' | 'accepted'

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user?.id || null)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchConnections = async () => {
    setLoading(true)
    try {
      let type = activeTab
      if (activeTab === 'accepted') {
        type = 'accepted'
      }
      
      const response = await fetch(`/api/connections?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      } else {
        console.error('Failed to fetch connections')
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
    fetchConnections()
  }, [activeTab])

  useEffect(() => {
    if (currentUserId) {
      fetchConnections()
    }
  }, [currentUserId])

  const handleConnectionAction = async (connectionId: string, action: 'accepted' | 'rejected') => {
    setProcessingIds(prev => new Set(prev).add(connectionId))
    
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
          status: action
        })
      })

      if (response.ok) {
        // Remove the connection from the current list immediately
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        const actionText = action === 'accepted' ? 'accepted' : 'rejected'
        alert(`Connection ${actionText} successfully!`)
        
        // If accepted, switch to the Connected tab to show the new connection
        if (action === 'accepted') {
          setActiveTab('accepted')
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to ${action} connection: ${errorData.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error)
      alert('Network error. Please try again.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(connectionId)
        return newSet
      })
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId))
    
    try {
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the connection from the current list immediately
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        alert('Connection removed successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to remove connection: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error removing connection:', error)
      alert('Network error. Please try again.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(connectionId)
        return newSet
      })
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'accepted': return <CheckIcon className="h-4 w-4 text-green-500" />
      case 'rejected': return <XMarkIcon className="h-4 w-4 text-red-500" />
      default: return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Expert': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const tabs = [
    { id: 'received', label: 'Received', count: connections.filter(c => activeTab === 'received').length },
    { id: 'sent', label: 'Sent', count: connections.filter(c => activeTab === 'sent').length },
    { id: 'accepted', label: 'Connected', count: connections.filter(c => activeTab === 'accepted').length }
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Connections</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage your skill swap connections, respond to requests, and stay connected with your learning community.
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {connections.length > 0 && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {connections.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'received' && 'No connection requests received'}
                    {activeTab === 'sent' && 'No connection requests sent'}
                    {activeTab === 'accepted' && 'No active connections'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'received' && 'When others want to connect with your skills, their requests will appear here.'}
                    {activeTab === 'sent' && 'Connection requests you send to others will appear here.'}
                    {activeTab === 'accepted' && 'Your established connections will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => {
                    // Determine which user to show based on current user ID
                    const otherUser = currentUserId === connection.requester_id ? {
                      name: connection.receiver_name,
                      email: connection.receiver_email,
                      avatar: connection.receiver_avatar
                    } : {
                      name: connection.requester_name,
                      email: connection.requester_email,
                      avatar: connection.requester_avatar
                    }

                    return (
                      <div key={connection.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200 opacity-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* User Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {otherUser.avatar ? (
                                <img
                                  src={otherUser.avatar}
                                  alt={otherUser.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                                    if (nextElement) {
                                      nextElement.style.display = 'flex'
                                    }
                                  }}
                                />
                              ) : null}
                              <span className={`${otherUser.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                {getInitials(otherUser.name || otherUser.email || 'U')}
                              </span>
                            </div>

                            {/* Connection Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {otherUser.name || otherUser.email || 'User'}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(connection.status)}`}>
                                  {getStatusIcon(connection.status)}
                                  <span className="ml-1">{connection.status}</span>
                                </span>
                              </div>

                              {/* Skill Info */}
                              {connection.skill_name && (
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-gray-900">{connection.skill_name}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-600">{connection.skill_category}</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(connection.skill_level)}`}>
                                    {connection.skill_level}
                                  </span>
                                </div>
                              )}

                              {/* Message */}
                              {connection.message && (
                                <p className="text-sm text-gray-600 mb-2 bg-gray-50 p-3 rounded-lg">
                                  &quot;{connection.message}&quot;
                                </p>
                              )}

                              <p className="text-xs text-gray-500">
                                {new Date(connection.created_at).toLocaleDateString()} at {new Date(connection.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            {activeTab === 'received' && connection.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleConnectionAction(connection.id, 'accepted')}
                                  disabled={processingIds.has(connection.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingIds.has(connection.id) ? 'Processing...' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleConnectionAction(connection.id, 'rejected')}
                                  disabled={processingIds.has(connection.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingIds.has(connection.id) ? 'Processing...' : 'Reject'}
                                </button>
                              </>
                            )}

                            {activeTab === 'accepted' && (
                              <>
                                <button
                                  onClick={() => window.location.href = `/chat/${connection.id}`}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Message
                                </button>
                                <button
                                  onClick={() => handleDeleteConnection(connection.id)}
                                  disabled={processingIds.has(connection.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove connection"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
