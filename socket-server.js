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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
