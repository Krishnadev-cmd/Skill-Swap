const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3001", 
      "http://localhost:3000",
      "https://skill-swap-kdisop2003-gmailcoms-projects.vercel.app",
      "https://skill-swap-clsjoblq5-kdisop2003-gmailcoms-projects.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
})

// Track users by their actual user ID (not socket ID)
const userSockets = new Map() // userId -> socketId
const socketUsers = new Map() // socketId -> userId

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // User identification - called when user logs in
  socket.on('identify-user', (userId) => {
    console.log(`User ${userId} identified with socket ${socket.id}`)
    userSockets.set(userId, socket.id)
    socketUsers.set(socket.id, userId)
  })

  // Join chat room
  socket.on('join-chat', (connectionId) => {
    socket.join(connectionId)
    console.log(`User ${socket.id} joined chat room: ${connectionId}`)
  })

  // Handle sending messages
  socket.on('send-message', (data) => {
    console.log('Message received:', data)
    // Broadcast to all users in the chat room except sender
    socket.to(data.connectionId).emit('receive-message', data)
  })

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.connectionId).emit('user-typing', data)
  })

  socket.on('stop-typing', (data) => {
    socket.to(data.connectionId).emit('user-stop-typing', data)
  })

  // Video Call Events - Global notifications
  socket.on('initiate-call', (data) => {
    console.log('Call initiated:', data)
    
    // Find the target user's socket ID globally
    const targetSocketId = userSockets.get(data.targetUserId)
    if (targetSocketId) {
      // Send call invitation directly to the target user (works on any page)
      io.to(targetSocketId).emit('incoming-call', {
        callerId: socket.id,
        callerUserId: socketUsers.get(socket.id),
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        connectionId: data.connectionId
      })
      console.log(`Call invitation sent to user ${data.targetUserId} on socket ${targetSocketId}`)
    } else {
      console.log(`Target user ${data.targetUserId} is not online`)
      // Notify caller that user is offline
      socket.emit('call-failed', { reason: 'User is offline' })
    }
  })

  socket.on('accept-call', (data) => {
    console.log('Call accepted:', data)
    // Find the caller's socket ID and notify them
    const callerSocketId = userSockets.get(data.callerUserId)
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', {
        connectionId: data.connectionId
      })
    }
  })

  socket.on('reject-call', (data) => {
    console.log('Call rejected:', data)
    // Find the caller's socket ID and notify them
    const callerSocketId = userSockets.get(data.callerUserId)
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-rejected', {
        connectionId: data.connectionId
      })
    }
  })

  socket.on('end-call', (data) => {
    console.log('Call ended:', data)
    // Notify all users in the connection that the call ended
    socket.to(data.connectionId).emit('call-ended', {
      connectionId: data.connectionId
    })
  })

  // WebRTC Signaling Events
  socket.on('webrtc-offer', (data) => {
    console.log('WebRTC offer:', data)
    socket.to(data.connectionId).emit('webrtc-offer', {
      offer: data.offer
    })
  })

  socket.on('webrtc-answer', (data) => {
    console.log('WebRTC answer:', data)
    socket.to(data.connectionId).emit('webrtc-answer', {
      answer: data.answer
    })
  })

  socket.on('webrtc-ice-candidate', (data) => {
    console.log('WebRTC ICE candidate:', data)
    socket.to(data.connectionId).emit('webrtc-ice-candidate', {
      candidate: data.candidate
    })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Get the user ID before removing from maps
    const userId = socketUsers.get(socket.id)
    
    if (userId) {
      console.log(`User ${userId} disconnected`)
      
      // Notify all other users that this user went offline
      socket.broadcast.emit('user-disconnected', {
        userId: userId,
        socketId: socket.id
      })
      
      // Clean up tracking maps
      userSockets.delete(userId)
      socketUsers.delete(socket.id)
      
      console.log(`Cleaned up tracking for user ${userId}`)
    }
  })
})

const PORT = process.env.SOCKET_PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
