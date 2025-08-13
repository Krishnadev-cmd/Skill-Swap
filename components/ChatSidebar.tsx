'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  UserIcon 
} from '@heroicons/react/24/outline'

interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  skill_name: string
  requester_name: string
  receiver_name: string
  requester_avatar: string
  receiver_avatar: string
  status: string
}

interface ChatSidebarProps {
  currentUserId: string | null
}

export default function ChatSidebar({ currentUserId }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch connected users
  const fetchConnectedUsers = async () => {
    if (!currentUserId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/connections?type=accepted')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error fetching connected users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchConnectedUsers()
    }
  }, [isOpen, currentUserId])

  const getOtherUser = (connection: Connection) => {
    if (!currentUserId) return null
    
    return currentUserId === connection.requester_id ? {
      name: connection.receiver_name,
      avatar: connection.receiver_avatar
    } : {
      name: connection.requester_name,
      avatar: connection.requester_avatar
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const handleChatClick = (connectionId: string) => {
    router.push(`/chat/${connectionId}`)
    setIsOpen(false)
  }

  const isCurrentChat = (connectionId: string) => {
    return pathname === `/chat/${connectionId}`
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-40"
        title="Open Chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Chat Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Chat Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h3 className="text-lg font-semibold">Chat</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Connected Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading chats...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No connected users</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect with someone to start chatting!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {connections.map((connection) => {
                const otherUser = getOtherUser(connection)
                if (!otherUser) return null

                return (
                  <button
                    key={connection.id}
                    onClick={() => handleChatClick(connection.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                      isCurrentChat(connection.id) ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
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
                        {getInitials(otherUser.name)}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {otherUser.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {connection.skill_name}
                      </p>
                    </div>

                    {/* Active Indicator */}
                    {isCurrentChat(connection.id) && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
