const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

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

  // Video Call Events
  socket.on('initiate-call', (data) => {
    console.log('Call initiated:', data)
    // Send call invitation to the other user in the connection
    socket.to(data.connectionId).emit('incoming-call', {
      callerId: socket.id,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      connectionId: data.connectionId
    })
  })

  socket.on('accept-call', (data) => {
    console.log('Call accepted:', data)
    // Notify the caller that the call was accepted
    socket.to(data.connectionId).emit('call-accepted', {
      connectionId: data.connectionId
    })
  })

  socket.on('reject-call', (data) => {
    console.log('Call rejected:', data)
    // Notify the caller that the call was rejected
    socket.to(data.connectionId).emit('call-rejected', {
      connectionId: data.connectionId
    })
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
  })
})

const PORT = process.env.SOCKET_PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
