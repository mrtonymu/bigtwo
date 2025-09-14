"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RoomBrowser } from '@/components/room-browser'
import { GameRulesSelector } from '@/components/game-rules-selector'
import { NetworkStatusIndicator } from '@/components/network-status-indicator'
import { useGameRooms } from '@/hooks/use-game-rooms'
import { useNetworkOptimization } from '@/hooks/use-network-optimization'
import { GameRules, PRESET_RULES } from '@/lib/game-rules'
import { Settings, Wifi, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export function EnhancedGameLobby() {
  const [playerName, setPlayerName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [selectedRules, setSelectedRules] = useState<GameRules>(PRESET_RULES.classic)
  const [showRulesSelector, setShowRulesSelector] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [roomSettings, setRoomSettings] = useState({
    isPrivate: false,
    allowSpectators: true,
    autoStart: false
  })

  const { createRoom, isLoading } = useGameRooms()
  
  // 网络优化 - 这里使用一个临时的gameId，在实际游戏开始后会更新
  const {
    networkStatus,
    syncStatus,
    manualSync
  } = useNetworkOptimization({
    gameId: 'lobby',
    playerId: playerName,
    maxRetries: 3,
    syncInterval: 10000
  })

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error('请输入玩家名称')
      return
    }
    
    if (!roomName.trim()) {
      toast.error('请输入房间名称')
      return
    }

    const settings = {
      name: roomName,
      isPrivate: roomSettings.isPrivate,
      maxPlayers: selectedRules.playerCount.default,
      rules: selectedRules,
      allowSpectators: roomSettings.allowSpectators
    }

    const roomId = await createRoom(settings, playerName)
    if (roomId) {
      toast.success(`房间创建成功！房间ID: ${roomId}`)
      // 这里可以导航到游戏页面
    }
  }

  const handleRoomJoined = (roomId: string) => {
    toast.success(`已加入房间: ${roomId}`)
    // 这里可以导航到游戏页面
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 头部状态栏 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🃏 大老二在线</h1>
        <div className="flex items-center gap-4">
          <NetworkStatusIndicator 
            networkStatus={networkStatus}
            syncStatus={syncStatus}
            onManualSync={manualSync}
          />
          <Badge variant="outline" className="text-sm">
            朋友聚会版
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 创建房间面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              创建房间
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>玩家名称</Label>
                <Input
                  placeholder="请输入您的名称"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div>
                <Label>房间名称</Label>
                <Input
                  placeholder="给房间起个名字"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            {/* 游戏规则选择 */}
            <div className="space-y-2">
              <Label>游戏规则</Label>
              <div 
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowRulesSelector(true)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedRules.name}</div>
                    <div className="text-sm text-gray-600">{selectedRules.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedRules.playerCount.default}人
                    </Badge>
                    {selectedRules.timeRules.enabled && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedRules.timeRules.turnTime}s
                      </Badge>
                    )}
                    <Settings className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 高级选项 */}
            <div className="space-y-3">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {showAdvancedOptions ? '隐藏' : '显示'}高级选项
              </button>
              
              {showAdvancedOptions && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>私人房间</Label>
                    <Switch
                      checked={roomSettings.isPrivate}
                      onCheckedChange={(checked) => 
                        setRoomSettings({...roomSettings, isPrivate: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>允许观战</Label>
                    <Switch
                      checked={roomSettings.allowSpectators}
                      onCheckedChange={(checked) => 
                        setRoomSettings({...roomSettings, allowSpectators: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>自动开始游戏</Label>
                    <Switch
                      checked={roomSettings.autoStart}
                      onCheckedChange={(checked) => 
                        setRoomSettings({...roomSettings, autoStart: checked})
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleCreateRoom}
              disabled={isLoading || !playerName.trim() || !roomName.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? '创建中...' : '🚀 创建房间'}
            </Button>
          </CardContent>
        </Card>

        {/* 网络状态和优化面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              网络状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">
                  {networkStatus === 'online' ? '🟢' : 
                   networkStatus === 'unstable' ? '🟡' : '🔴'}
                </div>
                <div className="text-sm font-medium">
                  {networkStatus === 'online' ? '连接正常' : 
                   networkStatus === 'unstable' ? '网络不稳定' : '网络断开'}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">
                  {syncStatus === 'synced' ? '✅' : 
                   syncStatus === 'syncing' ? '🔄' : 
                   syncStatus === 'failed' ? '❌' : '⚠️'}
                </div>
                <div className="text-sm font-medium">
                  {syncStatus === 'synced' ? '已同步' : 
                   syncStatus === 'syncing' ? '同步中' : 
                   syncStatus === 'failed' ? '同步失败' : '数据冲突'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">网络优化功能</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  自动断线重连
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  离线操作缓存
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  数据冲突处理
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  智能同步频率
                </div>
              </div>
            </div>

            {(networkStatus === 'unstable' || syncStatus === 'failed') && (
              <Button 
                onClick={manualSync}
                variant="outline"
                className="w-full"
                size="sm"
              >
                🔄 手动重连
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 房间浏览器 */}
      <Card>
        <CardHeader>
          <CardTitle>🏠 可用房间</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomBrowser 
            playerName={playerName}
            onRoomJoined={handleRoomJoined}
          />
        </CardContent>
      </Card>

      {/* 游戏规则选择器模态窗口 */}
      {showRulesSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <GameRulesSelector
              selectedRules={selectedRules}
              onRulesChange={setSelectedRules}
              onClose={() => setShowRulesSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}