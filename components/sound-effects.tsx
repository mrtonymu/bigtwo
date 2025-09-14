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

// 音效控制Hook
export function useSoundEffects() {
  const [playCardSound, setPlayCardSound] = useState(false)
  const [winSound, setWinSound] = useState(false)
  const [backgroundMusic, setBackgroundMusic] = useState(false)

  const triggerCardSound = () => setPlayCardSound(true)
  const triggerWinSound = () => setWinSound(true)
  const toggleBackgroundMusic = () => setBackgroundMusic(prev => !prev)

  // 重置音效状态
  useEffect(() => {
    if (playCardSound) {
      const timer = setTimeout(() => setPlayCardSound(false), 100)
      return () => clearTimeout(timer)
    }
  }, [playCardSound])

  useEffect(() => {
    if (winSound) {
      const timer = setTimeout(() => setWinSound(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [winSound])

  return {
    triggerCardSound,
    triggerWinSound,
    toggleBackgroundMusic,
    backgroundMusic,
    SoundEffects: () => (
      <SoundEffects
        playCardSound={playCardSound}
        winSound={winSound}
        backgroundMusic={backgroundMusic}
      />
    )
  }
}
