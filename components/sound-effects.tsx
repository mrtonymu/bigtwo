"use client"

import { useEffect, useState } from 'react'
import useSound from 'use-sound'

interface SoundEffectsProps {
  playCardSound: boolean
  winSound: boolean
  backgroundMusic: boolean
  onCardPlayed?: () => void
  onGameWon?: () => void
}

export function SoundEffects({ 
  playCardSound, 
  winSound, 
  backgroundMusic, 
  onCardPlayed,
  onGameWon 
}: SoundEffectsProps) {
  // 使用Web Audio API生成音效
  const [playCard] = useSound('/sounds/card-play.mp3', { 
    volume: 0.3,
    onend: onCardPlayed 
  })
  
  const [playWin] = useSound('/sounds/win.mp3', { 
    volume: 0.5,
    onend: onGameWon 
  })

  const [playBackground] = useSound('/sounds/background.mp3', { 
    volume: 0.1,
    loop: true 
  })

  // 生成简单的音效
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 生成出牌音效
      const generateCardSound = () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      }

      // 生成获胜音效
      const generateWinSound = () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // 胜利音效：上升的音阶
        const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6
        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          
          osc.connect(gain)
          gain.connect(audioContext.destination)
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.2)
          gain.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.2)
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.3)
          
          osc.start(audioContext.currentTime + index * 0.2)
          osc.stop(audioContext.currentTime + index * 0.2 + 0.3)
        })
      }

      // 生成背景音乐
      const generateBackgroundMusic = () => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime) // A3
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime)
        
        oscillator.start(audioContext.currentTime)
        
        // 停止背景音乐
        return () => {
          oscillator.stop()
        }
      }

      // 存储音效函数到全局
      ;(window as any).playCardSound = generateCardSound
      ;(window as any).playWinSound = generateWinSound
      ;(window as any).playBackgroundMusic = generateBackgroundMusic
    }
  }, [])

  // 播放音效
  useEffect(() => {
    if (playCardSound && typeof window !== 'undefined') {
      ;(window as any).playCardSound?.()
    }
  }, [playCardSound])

  useEffect(() => {
    if (winSound && typeof window !== 'undefined') {
      ;(window as any).playWinSound?.()
    }
  }, [winSound])

  useEffect(() => {
    if (backgroundMusic && typeof window !== 'undefined') {
      const stopMusic = (window as any).playBackgroundMusic?.()
      return stopMusic
    }
  }, [backgroundMusic])

  return null
}

export function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [backgroundMusic, setBackgroundMusic] = useState(false)
  
  // 增强的音效生成函数
  const playClickSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('音效播放失败:', error)
    }
  }

  const playSuccessSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('音效播放失败:', error)
    }
  }

  const playErrorSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn('音效播放失败:', error)
    }
  }

  const toggleBackgroundMusic = () => {
    setBackgroundMusic(!backgroundMusic)
  }

  return {
    soundEnabled,
    setSoundEnabled,
    backgroundMusic,
    toggleBackgroundMusic,
    playClickSound,
    playSuccessSound,
    playErrorSound
  }
}
