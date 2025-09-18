"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GameOptionsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (options: GameOptions) => void
  gameId?: string // 添加游戏ID用于多玩家同步
}

export interface GameOptions {
  allowSpectators: boolean
  gameSpeed: "slow" | "normal" | "fast"
  autoPass: boolean
  showCardCount: boolean
  cardSorting: "auto" | "suit" | "rank"
  autoArrange: boolean
}

// 默认游戏选项
const defaultOptions: GameOptions = {
  allowSpectators: true,
  gameSpeed: "normal",
  autoPass: false,
  showCardCount: true,
  cardSorting: "auto",
  autoArrange: true,
}

// 从本地存储加载游戏选项
export const loadGameOptions = (): GameOptions => {
  if (typeof window === 'undefined') return defaultOptions
  
  try {
    const saved = localStorage.getItem('big-two-game-options')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 确保所有必需的字段都存在
      return { ...defaultOptions, ...parsed }
    }
  } catch (error) {
    console.error('Error loading game options:', error)
  }
  
  return defaultOptions
}

// 保存游戏选项到本地存储
const saveGameOptions = (options: GameOptions) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('big-two-game-options', JSON.stringify(options))
  } catch (error) {
    console.error('Error saving game options:', error)
  }
}

export function GameOptions({ isOpen, onClose, onSave, gameId }: GameOptionsProps) {
  const [options, setOptions] = useState<GameOptions>(defaultOptions)

  // 组件挂载时加载保存的选项
  useEffect(() => {
    const savedOptions = loadGameOptions()
    setOptions(savedOptions)
  }, [])

  if (!isOpen) return null

  const handleSave = async () => {
    // 保存到本地存储
    saveGameOptions(options)
    
    // 如果有gameId，同步到服务器
    if (gameId) {
      try {
        const response = await fetch(`/api/games/${gameId}/options`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameOptions: options }),
        })
        
        if (!response.ok) {
          console.error('Failed to sync game options to server')
        }
      } catch (error) {
        console.error('Error syncing game options:', error)
      }
    }
    
    // 通知父组件
    onSave(options)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Game Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="spectators">Allow Spectators</Label>
            <Switch
              id="spectators"
              checked={options.allowSpectators}
              onCheckedChange={(checked) => setOptions({ ...options, allowSpectators: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Game Speed</Label>
            <Select
              value={options.gameSpeed}
              onValueChange={(value: "slow" | "normal" | "fast") => setOptions({ ...options, gameSpeed: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow (30s per turn)</SelectItem>
                <SelectItem value="normal">Normal (15s per turn)</SelectItem>
                <SelectItem value="fast">Fast (10s per turn)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autopass">Auto Pass</Label>
            <Switch
              id="autopass"
              checked={options.autoPass}
              onCheckedChange={(checked) => setOptions({ ...options, autoPass: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cardcount">Show Card Count</Label>
            <Switch
              id="cardcount"
              checked={options.showCardCount}
              onCheckedChange={(checked) => setOptions({ ...options, showCardCount: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Card Sorting</Label>
            <Select
              value={options.cardSorting}
              onValueChange={(value: "auto" | "suit" | "rank") => setOptions({ ...options, cardSorting: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (按花色分组)</SelectItem>
                <SelectItem value="suit">By Suit (按花色排序)</SelectItem>
                <SelectItem value="rank">By Rank (按点数排序)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoarrange">Auto Arrange Cards</Label>
            <Switch
              id="autoarrange"
              checked={options.autoArrange}
              onCheckedChange={(checked) => setOptions({ ...options, autoArrange: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
