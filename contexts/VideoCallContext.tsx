'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useSocket } from './SocketContext'
import Peer from 'simple-peer'

interface VideoCallContextType {
  isInCall: boolean
  isReceivingCall: boolean
  incomingCall: IncomingCall | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  initiateCall: (connectionId: string, callerName: string, callerAvatar?: string) => void
  acceptCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoOff: boolean
  callStatus: string
}

interface IncomingCall {
  callerId: string
  callerName: string
  callerAvatar?: string
  connectionId: string
}

const VideoCallContext = createContext<VideoCallContextType>({
  isInCall: false,
  isReceivingCall: false,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
  isMuted: false,
  isVideoOff: false,
  callStatus: 'idle'
})

export const useVideoCall = () => {
  const context = useContext(VideoCallContext)
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider')
  }
  return context
}

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket()
  const [isInCall, setIsInCall] = useState(false)
  const [isReceivingCall, setIsReceivingCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callStatus, setCallStatus] = useState('idle')
  
  const peerRef = useRef<Peer.Instance | null>(null)
  const currentConnectionId = useRef<string | null>(null)

  // Initialize media stream
  const initializeMediaStream = async () => {
    try {
      console.log('Requesting user media...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      console.log('Media stream obtained:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      console.log('Audio tracks:', stream.getAudioTracks())
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  // Cleanup media stream
  const cleanupMediaStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }
  }

  // Initiate call
  const initiateCall = async (connectionId: string, callerName: string, callerAvatar?: string) => {
    try {
      console.log('Initiating call:', { connectionId, callerName, callerAvatar })
      setCallStatus('calling')
      currentConnectionId.current = connectionId
      
      const stream = await initializeMediaStream()
      console.log('Media stream initialized:', stream)
      
      if (socket) {
        console.log('Emitting initiate-call event')
        socket.emit('initiate-call', {
          connectionId,
          callerName,
          callerAvatar
        })
      } else {
        console.error('Socket not available')
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      setCallStatus('failed')
    }
  }

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !socket) return

    try {
      console.log('Accepting call, setting isInCall to true immediately')
      setCallStatus('connecting')
      setIsInCall(true)  // Set this immediately when accepting
      setIsReceivingCall(false)
      setIncomingCall(null)
      
      const stream = await initializeMediaStream()
      
      // Create peer connection as answerer
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      })

      peer.on('signal', (signal: any) => {
        socket.emit('webrtc-answer', {
          connectionId: incomingCall.connectionId,
          answer: signal
        })
      })

      peer.on('stream', (remoteStream: MediaStream) => {
        console.log('Remote stream received in acceptCall')
        setRemoteStream(remoteStream)
        setCallStatus('connected')
      })

      peerRef.current = peer
      currentConnectionId.current = incomingCall.connectionId

      socket.emit('accept-call', {
        callerId: incomingCall.callerId,
        connectionId: incomingCall.connectionId
      })

      console.log('Call accepted, isInCall should be true')
    } catch (error) {
      console.error('Error accepting call:', error)
      rejectCall()
    }
  }

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall || !socket) return

    socket.emit('reject-call', {
      callerId: incomingCall.callerId,
      connectionId: incomingCall.connectionId
    })

    setIsReceivingCall(false)
    setIncomingCall(null)
    setCallStatus('idle')
  }

  // End call
  const endCall = () => {
    if (socket && currentConnectionId.current) {
      socket.emit('end-call', {
        connectionId: currentConnectionId.current
      })
    }

    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    cleanupMediaStream()
    setIsInCall(false)
    setIsReceivingCall(false)
    setIncomingCall(null)
    setCallStatus('idle')
    currentConnectionId.current = null
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Incoming call
    socket.on('incoming-call', (data: IncomingCall) => {
      setIncomingCall(data)
      setIsReceivingCall(true)
      setCallStatus('incoming')
    })

    // Call accepted
    socket.on('call-accepted', async (data: { connectionId: string }) => {
      try {
        console.log('Call accepted, setting isInCall to true immediately')
        setIsInCall(true)  // Set this immediately when call is accepted
        setCallStatus('connecting')
        
        const stream = localStream || await initializeMediaStream()
        
        // Create peer connection as initiator
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream
        })

        peer.on('signal', (signal: any) => {
          socket.emit('webrtc-offer', {
            connectionId: data.connectionId,
            offer: signal
          })
        })

        peer.on('stream', (remoteStream: MediaStream) => {
          console.log('Remote stream received in call-accepted')
          setRemoteStream(remoteStream)
          setCallStatus('connected')
        })

        peerRef.current = peer
        console.log('Call accepted handler complete, isInCall should be true')
      } catch (error) {
        console.error('Error handling call acceptance:', error)
        endCall()
      }
    })

    // Call rejected
    socket.on('call-rejected', () => {
      setCallStatus('rejected')
      setTimeout(() => {
        endCall()
      }, 2000)
    })

    // Call ended
    socket.on('call-ended', () => {
      endCall()
    })

    // WebRTC signaling
    socket.on('webrtc-offer', (data: { offer: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(data.offer)
      }
    })

    socket.on('webrtc-answer', (data: { answer: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(data.answer)
      }
    })

    socket.on('webrtc-ice-candidate', (data: { candidate: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(data.candidate)
      }
    })

    return () => {
      socket.off('incoming-call')
      socket.off('call-accepted')
      socket.off('call-rejected')
      socket.off('call-ended')
      socket.off('webrtc-offer')
      socket.off('webrtc-answer')
      socket.off('webrtc-ice-candidate')
    }
  }, [socket, localStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  return (
    <VideoCallContext.Provider value={{
      isInCall,
      isReceivingCall,
      incomingCall,
      localStream,
      remoteStream,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      isMuted,
      isVideoOff,
      callStatus
    }}>
      {children}
    </VideoCallContext.Provider>
  )
}
