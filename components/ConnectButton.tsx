'use client'

import { useState, useEffect } from 'react'

interface ConnectButtonProps {
  skillId: string
  userId: string
  skillName: string
  userName: string
  className?: string
}

export default function ConnectButton({ 
  skillId, 
  userId, 
  skillName, 
  userName, 
  className = '' 
}: ConnectButtonProps) {
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'loading'>('loading')

  // Check if already connected to this user
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const response = await fetch('/api/connections?type=all')
        if (response.ok) {
          const data = await response.json()
          
          // Find any connection with this user or skill
          const connection = data.connections.find((conn: any) => 
            (
              (conn.requester_id === userId || conn.receiver_id === userId) ||
              conn.skill_id === skillId
            )
          )
          
          if (connection) {
            if (connection.status === 'accepted') {
              setConnectionStatus('accepted')
            } else if (connection.status === 'pending') {
              setConnectionStatus('pending')
            } else {
              setConnectionStatus('none')
            }
          } else {
            setConnectionStatus('none')
          }
        }
      } catch (error) {
        console.error('Error checking existing connection:', error)
        setConnectionStatus('none')
      }
    }

    checkExistingConnection()
  }, [userId, skillId])

  const handleConnect = async () => {
    setConnecting(true)
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: userId,
          skill_id: skillId,
          message: `Hi! I'm interested in learning about ${skillName}. Would you like to connect?`
        })
      })

      if (response.ok) {
        setConnectionStatus('pending')
        alert(`Connection request sent to ${userName}!`)
      } else {
        const errorData = await response.json()
        alert(`Failed to send connection request: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      alert('Network error. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  if (connectionStatus === 'loading') {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-200 text-gray-500 text-sm rounded-lg cursor-not-allowed ${className}`}
      >
        Loading...
      </button>
    )
  }

  if (connectionStatus === 'accepted') {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-green-600 text-white text-sm rounded-lg opacity-75 cursor-not-allowed ${className}`}
      >
        Connected
      </button>
    )
  }

  if (connectionStatus === 'pending') {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg opacity-75 cursor-not-allowed ${className}`}
      >
        Pending
      </button>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className={`px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {connecting ? 'Connecting...' : 'Connect'}
    </button>
  )
}
