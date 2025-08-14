'use client'

import { useVideoCall } from '@/contexts/VideoCallContext'
import UserAvatar from './UserAvatar'

export default function IncomingCallNotification() {
  const { isReceivingCall, incomingCall, acceptCall, rejectCall } = useVideoCall()

  if (!isReceivingCall || !incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <UserAvatar 
              avatarUrl={incomingCall.callerAvatar || null} 
              fullName={incomingCall.callerName}
              email={null}
              size="lg"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {incomingCall.callerName}
          </h2>
          <p className="text-gray-600">Incoming video call...</p>
        </div>

        {/* Call Actions */}
        <div className="flex justify-center space-x-6">
          {/* Reject Call */}
          <button
            onClick={rejectCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
            </svg>
          </button>

          {/* Accept Call */}
          <button
            onClick={acceptCall}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>

        {/* Ripple Animation */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-4 rounded-2xl border-2 border-blue-400 animate-ping opacity-30"></div>
          <div className="absolute inset-2 rounded-2xl border-2 border-blue-300 animate-ping opacity-20 animation-delay-300"></div>
        </div>
      </div>
    </div>
  )
}
