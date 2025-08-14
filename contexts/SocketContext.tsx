'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'

interface SocketContextType {
  socket: any | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<any | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io('http://localhost:4000', {
      path: '/socket.io/',
      transports: ['websocket']
    })

    // Get user information and identify to socket server
    const identifyUser = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const user = await response.json()
          // Send user identification to socket server
          socketInstance.emit('identify-user', user.id)
          console.log(`User identified on socket: ${user.id}`)
        }
      } catch (error) {
        console.error('Failed to identify user to socket server:', error)
      }
    }

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      setSocket(socketInstance)
      
      // Identify user once connected
      identifyUser()
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
