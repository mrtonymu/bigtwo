import React from 'react'
import { useGameRooms } from '@/hooks/use-game-rooms'

interface RoomBrowserProps {
  onRoomJoined?: (roomId: string) => void
  playerName: string
}

export function RoomBrowser({ onRoomJoined, playerName }: RoomBrowserProps) {
  const {
    availableRooms,
    isLoading,
    isSearching,
    error,
    refreshRooms,
    joinRoom,
    quickMatch
  } = useGameRooms()

  const handleJoinRoom = async (roomId: string) => {
    const success = await joinRoom(roomId, playerName)
    if (success && onRoomJoined) {
      onRoomJoined(roomId)
    }
  }

  const handleQuickMatch = async () => {
    const roomId = await quickMatch(playerName)
    if (roomId && onRoomJoined) {
      onRoomJoined(roomId)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">❌ {error}</p>
        <button
          onClick={refreshRooms}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">可用房间</h3>
        <div className="flex gap-2">
          <button
            onClick={handleQuickMatch}
            disabled={isSearching}
            className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors ${
              isSearching ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSearching ? '匹配中...' : '🚀 快速匹配'}
          </button>
          <button
            onClick={refreshRooms}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isLoading ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>加载房间列表...</p>
        </div>
      ) : availableRooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无可用房间</p>
          <p className="text-sm">点击"快速匹配"开始游戏</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {availableRooms.map(room => (
            <div 
              key={room.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{room.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👥 {room.currentPlayers}/{room.maxPlayers}</span>
                    <span>🕒 {formatTime(room.created_at)}</span>
                    <span>📋 {room.rules?.name || '经典规则'}</span>
                    {room.isPrivate && <span>🔒 私人</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  加入
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}