// socket-server.js (root directory)
const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)
  
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
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
      console.log(`Call initiated by ${socket.id} to room: ${data.connectionId}`)
      socket.to(data.connectionId).emit('incoming-call', {
        callerId: socket.id,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        connectionId: data.connectionId
      })
    })

    socket.on('accept-call', (data) => {
      console.log(`Call accepted by ${socket.id}`)
      socket.to(data.callerId).emit('call-accepted', {
        accepterId: socket.id,
        connectionId: data.connectionId
      })
    })

    socket.on('reject-call', (data) => {
      console.log(`Call rejected by ${socket.id}`)
      socket.to(data.callerId).emit('call-rejected', {
        connectionId: data.connectionId
      })
    })

    socket.on('end-call', (data) => {
      console.log(`Call ended by ${socket.id}`)
      socket.to(data.connectionId).emit('call-ended', {
        connectionId: data.connectionId
      })
    })

    // WebRTC Signaling Events
    socket.on('webrtc-offer', (data) => {
      socket.to(data.connectionId).emit('webrtc-offer', {
        offer: data.offer,
        callerId: socket.id
      })
    })

    socket.on('webrtc-answer', (data) => {
      socket.to(data.connectionId).emit('webrtc-answer', {
        answer: data.answer,
        answerId: socket.id
      })
    })

    socket.on('webrtc-ice-candidate', (data) => {
      socket.to(data.connectionId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
