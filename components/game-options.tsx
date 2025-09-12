"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GameOptionsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (options: GameOptions) => void
}

export interface GameOptions {
  allowSpectators: boolean
  gameSpeed: "slow" | "normal" | "fast"
  autoPass: boolean
  showCardCount: boolean
  cardSorting: "auto" | "suit" | "rank"
  autoArrange: boolean
}

export function GameOptions({ isOpen, onClose, onSave }: GameOptionsProps) {
  const [options, setOptions] = useState<GameOptions>({
    allowSpectators: true,
    gameSpeed: "normal",
    autoPass: false,
    showCardCount: true,
    cardSorting: "auto",
    autoArrange: true,
  })

  if (!isOpen) return null

  const handleSave = () => {
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
