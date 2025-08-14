'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useSocket } from '@/contexts/SocketContext'
import { useVideoCall } from '@/contexts/VideoCallContext'
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  ArrowLeftIcon,
  VideoCameraIcon 
} from '@heroicons/react/24/outline'

interface Message {
  id: string
  connection_id: string
  sender_id: string
  content: string
  message_type: string
  created_at: string
}

interface ConnectionInfo {
  id: string
  requester_id: string
  receiver_id: string
  skill_name: string
  requester_name: string
  receiver_name: string
  requester_avatar: string
  receiver_avatar: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const connectionId = params.connectionId as string
  const { socket, isConnected } = useSocket()
  const { initiateCall } = useVideoCall()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [typing, setTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserId(userData.id || null)
        } else {
          console.error('Failed to fetch user info, status:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }
    
    fetchUserInfo()
  }, [])

  // Fetch connection info and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch connection info
        const connResponse = await fetch(`/api/connections?id=${connectionId}`)
        if (connResponse.ok) {
          const connData = await connResponse.json()
          setConnectionInfo(connData.connection)
        } else {
          console.error('Failed to fetch connection info')
        }

        // Fetch messages
        const msgResponse = await fetch(`/api/messages?connectionId=${connectionId}`)
        if (msgResponse.ok) {
          const msgData = await msgResponse.json()
          setMessages(msgData.messages || [])
        } else {
          console.error('Failed to fetch messages')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (connectionId) {
      fetchData()
    }
  }, [connectionId])

  // Socket.IO event handlers
  useEffect(() => {
    if (socket && connectionId) {
      // Join the chat room
      socket.emit('join-chat', connectionId)

      // Listen for new messages
      socket.on('receive-message', (data: any) => {
        setMessages(prev => [...prev, data.message])
      })

      // Listen for typing indicators
      socket.on('user-typing', (data: any) => {
        if (data.userId !== currentUserId) {
          setOtherUserTyping(true)
        }
      })

      socket.on('user-stop-typing', (data: any) => {
        if (data.userId !== currentUserId) {
          setOtherUserTyping(false)
        }
      })

      return () => {
        socket.off('receive-message')
        socket.off('user-typing')
        socket.off('user-stop-typing')
      }
    }
  }, [socket, connectionId, currentUserId])

  // Handle typing indicators
  const handleTyping = () => {
    if (!typing && socket) {
      setTyping(true)
      socket.emit('typing', { connectionId, userId: currentUserId })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
      if (socket) {
        socket.emit('stop-typing', { connectionId, userId: currentUserId })
      }
    }, 1000)
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add message to local state
        setMessages(prev => [...prev, data.message])
        
        // Emit to other users via Socket.IO
        if (socket) {
          socket.emit('send-message', {
            connectionId,
            message: data.message
          })
        }

        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else {
      handleTyping()
    }
  }

  const getOtherUser = () => {
    if (!connectionInfo || !currentUserId) return null
    
    const otherUser = currentUserId === connectionInfo.requester_id ? {
      name: connectionInfo.receiver_name,
      avatar: connectionInfo.receiver_avatar
    } : {
      name: connectionInfo.requester_name,
      avatar: connectionInfo.requester_avatar
    }
    
    return otherUser
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const getUserDisplayName = (message: Message) => {
    if (message.sender_id === currentUserId) return 'You'
    
    // Try to get the other user's name from connection info
    if (connectionInfo) {
      if (message.sender_id === connectionInfo.requester_id) {
        return connectionInfo.requester_name || 'User'
      } else if (message.sender_id === connectionInfo.receiver_id) {
        return connectionInfo.receiver_name || 'User'
      }
    }
    
    return 'User'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  const otherUser = getOtherUser()

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Chat Header */}
          <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/connections')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {otherUser?.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const fallback = parent.querySelector('.avatar-fallback') as HTMLElement
                        if (fallback) {
                          fallback.style.display = 'flex'
                        }
                      }
                    }}
                  />
                ) : null}
                <span className={`avatar-fallback ${otherUser?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full absolute inset-0`}>
                  {getInitials(otherUser?.name || 'User')}
                </span>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {otherUser?.name || 'User'}
                </h2>
                {connectionInfo?.skill_name && (
                  <p className="text-sm text-gray-600">
                    About: {connectionInfo.skill_name}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Video Call Button */}
              <button
                onClick={() => {
                  console.log('Video call button clicked')
                  console.log('otherUser:', otherUser)
                  console.log('connectionId:', connectionId)
                  console.log('currentUserId:', currentUserId)
                  console.log('connectionInfo:', connectionInfo)
                  
                  if (otherUser && connectionId) {
                    const callerName = currentUserId === connectionInfo?.requester_id ? connectionInfo?.requester_name : connectionInfo?.receiver_name || 'You'
                    console.log('Calling initiateCall with:', { connectionId, callerName, avatar: otherUser.avatar })
                    initiateCall(connectionId, callerName, otherUser.avatar)
                  } else {
                    console.error('Missing required data for call:', { otherUser, connectionId })
                  }
                }}
                className="p-3 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors rounded-lg"
                title="Start video call"
              >
                <VideoCameraIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="bg-gray-50 border-x border-gray-100 h-96 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Start the conversation!</p>
                <p className="text-sm text-gray-500 mt-1">Send a message to begin chatting</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUserId
                const isConsecutive = index > 0 && 
                  messages[index - 1].sender_id === message.sender_id &&
                  new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() < 300000 // 5 minutes
                
                console.log('Message:', message)
                console.log('Current User ID:', currentUserId)
                console.log('Message Sender ID:', message.sender_id)
                console.log('Is Current User:', isCurrentUser)
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                      isConsecutive ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {/* Message Bubble */}
                      <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                      }`}>
                        {/* Message Content */}
                        <p className="text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                        
                        {/* Message Time */}
                        <div className={`flex items-center justify-end mt-1 space-x-1`}>
                          <span className={`text-xs ${
                            isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          
                          {/* Read Receipt for sent messages */}
                          {isCurrentUser && (
                            <div className="flex">
                              <svg className="w-3 h-3 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-3 h-3 text-blue-200 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Sender Avatar (for received messages) */}
                      {!isCurrentUser && !isConsecutive && (
                        <div className="flex items-center mt-1 ml-3">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            {otherUser?.avatar ? (
                              <img
                                src={otherUser.avatar}
                                alt={otherUser.name || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    const fallback = parent.querySelector('.mini-avatar-fallback') as HTMLElement
                                    if (fallback) {
                                      fallback.style.display = 'flex'
                                    }
                                  }
                                }}
                              />
                            ) : null}
                            <span className={`mini-avatar-fallback ${otherUser?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full absolute inset-0`}>
                              {getInitials(otherUser?.name || 'U')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            {getUserDisplayName(message)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            
            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                    <div className="flex space-x-1 items-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-end space-x-3">
              {/* Message Input */}
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none max-h-32"
                  style={{
                    minHeight: '48px',
                    height: 'auto'
                  }}
                  disabled={sending}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                  }}
                />
              </div>
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
                  newMessage.trim() && !sending
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg transform scale-100'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Character count or typing indicator */}
            <div className="flex justify-between items-center mt-2 px-1">
              <div className="text-xs text-gray-500">
                {otherUserTyping && (
                  <span className="text-blue-600">
                    {otherUser?.name || 'User'} is typing...
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {newMessage.length > 0 && `${newMessage.length}/1000`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
