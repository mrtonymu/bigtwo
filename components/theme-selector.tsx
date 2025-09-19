"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Theme {
  id: string
  name: string
  description: string
  cardStyle: {
    background: string
    border: string
    text: string
    shadow: string
  }
  tableStyle: {
    background: string
    accent: string
  }
  preview: string
}

const themes: Theme[] = [
  {
    id: 'classic',
    name: '经典',
    description: '传统扑克牌样式',
    cardStyle: {
      background: 'bg-white',
      border: 'border-gray-300',
      text: 'text-black',
      shadow: 'shadow-sm'
    },
    tableStyle: {
      background: 'bg-gray-50',
      accent: 'bg-blue-500'
    },
    preview: '♠♥♦♣'
  },
  {
    id: 'dark',
    name: '暗黑',
    description: '深色主题，护眼舒适',
    cardStyle: {
      background: 'bg-gray-800',
      border: 'border-gray-600',
      text: 'text-white',
      shadow: 'shadow-lg'
    },
    tableStyle: {
      background: 'bg-gray-900',
      accent: 'bg-purple-500'
    },
    preview: '♠♥♦♣'
  },
  {
    id: 'neon',
    name: '霓虹',
    description: '炫酷霓虹效果',
    cardStyle: {
      background: 'bg-black',
      border: 'border-cyan-400',
      text: 'text-cyan-400',
      shadow: 'shadow-cyan-500/50 shadow-lg'
    },
    tableStyle: {
      background: 'bg-gray-900',
      accent: 'bg-cyan-500'
    },
    preview: '♠♥♦♣'
  },
  {
    id: 'vintage',
    name: '复古',
    description: '怀旧复古风格',
    cardStyle: {
      background: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      shadow: 'shadow-amber-200'
    },
    tableStyle: {
      background: 'bg-amber-100',
      accent: 'bg-amber-600'
    },
    preview: '♠♥♦♣'
  },
  {
    id: 'ocean',
    name: '海洋',
    description: '清新海洋主题',
    cardStyle: {
      background: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      shadow: 'shadow-blue-200'
    },
    tableStyle: {
      background: 'bg-blue-100',
      accent: 'bg-blue-500'
    },
    preview: '♠♥♦♣'
  },
  {
    id: 'forest',
    name: '森林',
    description: '自然森林主题',
    cardStyle: {
      background: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-900',
      shadow: 'shadow-green-200'
    },
    tableStyle: {
      background: 'bg-green-100',
      accent: 'bg-green-500'
    },
    preview: '♠♥♦♣'
  }
]

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export function ThemeSelector({ isOpen, onClose, currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(currentTheme)
    }
  }, [isOpen, currentTheme])

  const handleApplyTheme = () => {
    onThemeChange(selectedTheme)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">🎨 选择主题</CardTitle>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedTheme.id === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTheme(theme)}
              >
                <div className="text-center mb-3">
                  <h3 className="font-semibold text-lg">{theme.name}</h3>
                  <p className="text-sm text-gray-600">{theme.description}</p>
                </div>
                
                {/* 主题预览 */}
                <div className={`${theme.tableStyle.background} p-4 rounded-lg mb-3`}>
                  <div className="flex justify-center gap-2">
                    <div className={`${theme.cardStyle.background} ${theme.cardStyle.border} ${theme.cardStyle.text} ${theme.cardStyle.shadow} border rounded-lg p-2 w-12 h-16 flex flex-col items-center justify-center`}>
                      <span className="text-lg font-bold">A</span>
                      <span className="text-red-500">♥</span>
                    </div>
                    <div className={`${theme.cardStyle.background} ${theme.cardStyle.border} ${theme.cardStyle.text} ${theme.cardStyle.shadow} border rounded-lg p-2 w-12 h-16 flex flex-col items-center justify-center`}>
                      <span className="text-lg font-bold">K</span>
                      <span className="text-black">♠</span>
                    </div>
                  </div>
                </div>
                
                {selectedTheme.id === theme.id && (
                  <div className="text-center">
                    <Badge className="bg-blue-500">已选择</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleApplyTheme}>
              应用主题
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 主题Hook
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])

  useEffect(() => {
    // 从localStorage加载保存的主题
    const savedTheme = localStorage.getItem('big-two-theme')
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme)
      if (theme) {
        setCurrentTheme(theme)
      }
    }
  }, []) // 只在组件挂载时执行一次，避免不必要的更新

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    localStorage.setItem('big-two-theme', theme.id)
  }

  return {
    currentTheme,
    changeTheme,
    themes
  }
}
