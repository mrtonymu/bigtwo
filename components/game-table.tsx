"use client"

import { useState, useEffect, useCallback } from "react"

import { type Card as GameCard, type Player, type GameState, type PlayHistory, type CardHint, isValidPlay, createDeck, dealCards, sortCards, autoArrangeCards, getPlayTypeName, getCardHints, getAutoPlaySuggestion, shouldAutoPass } from "@/lib/game-logic"
import { useErrorHandler } from '@/lib/utils/error-handler'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameOptions, type GameOptions as GameOptionsType, loadGameOptions } from "@/components/game-options"
import Link from "next/link"
import toast from "react-hot-toast"
import { useSmartDataSync } from "@/lib/utils/database-optimizer"
import { useSafeTimer, useSafeSupabaseSubscription } from "@/lib/utils/memory-manager"
import { useReconnect } from "@/hooks/use-reconnect"
import { createClient } from "@/lib/supabase/client"
import { type DraggableCardProps, type ThemeConfig } from "@/lib/types/game"
import { type Theme } from "@/components/theme-selector"

import { GameTableSkeleton } from "@/components/game-room-skeleton"
import { CNFLIXLogo } from "@/components/cnflix-logo"
import { useSoundEffects, SoundEffects } from "@/components/sound-effects"
import { GameStats } from "@/components/game-stats"
import { ThemeSelector, useTheme } from "@/components/theme-selector"
import { GameLayout } from "@/components/game-layout"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface GameTableProps {
  gameId: string
  playerName: string
}

// 可拖拽的卡片组件
function DraggableCard({ card, index, isSelected, onClick, currentTheme, clickAnimation }: DraggableCardProps & { clickAnimation?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${card.suit}-${card.rank}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isRedSuit = card.suit === "hearts" || card.suit === "diamonds"
  const suitClass = isRedSuit ? "red-suit" : "black-suit"

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      key={`${card.suit}-${card.rank}-${index}`}
      data-card-id={`${card.suit}-${card.rank}`}
      onClick={onClick}
      className={`playing-card ${suitClass} ${
        isSelected ? "selected" : ""
      } modern-card-deal enhanced-card-hover ${
        isSelected ? 'enhanced-card-selected' : ''
      } ${clickAnimation === `${card.suit}-${card.rank}` ? 'card-flip' : ''} 
      ${currentTheme.cardStyle.background} ${currentTheme.cardStyle.border} ${currentTheme.cardStyle.text} ${currentTheme.cardStyle.shadow}
      w-full h-auto min-h-[60px] sm:min-h-[80px] 
      text-xs sm:text-sm 
      touch-manipulation 
      active:scale-95 
      transition-all duration-200`}
      data-animation-delay={index * 50}
    >
      <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2">
        <span className={`card-rank font-bold ${
          isRedSuit ? "text-red-600" : "text-gray-800"
        }`}>
          {card.display}
        </span>
        <span
          className={`card-suit text-lg sm:text-xl ${
            isRedSuit ? "text-red-500" : "text-gray-700"
          }`}
        >
          {card.suit === "hearts" && "♥"}
          {card.suit === "diamonds" && "♦"}
          {card.suit === "clubs" && "♣"}
          {card.suit === "spades" && "♠"}
        </span>
      </div>
    </button>
  )
}

export function GameTable({ gameId, playerName }: GameTableProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myCards, setMyCards] = useState<GameCard[]>([])
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([])
  const [myPosition, setMyPosition] = useState<number>(-1)
  const [gameWinner, setGameWinner] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameOptions, setGameOptions] = useState<GameOptionsType>(() => {
    // 在客户端加载保存的游戏选项
    if (typeof window !== 'undefined') {
      return loadGameOptions()
    }
    // 服务端渲染时使用默认值
    return {
      allowSpectators: true,
      gameSpeed: "normal",
      autoPass: false,
      showCardCount: true,
      cardSorting: "auto",
      autoArrange: true,
    }
  })
  const [showGameStart, setShowGameStart] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [turnTimer, setTurnTimer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [cardHints, setCardHints] = useState<CardHint[]>([])
  const [showHints, setShowHints] = useState(false)
  const [clickAnimation, setClickAnimation] = useState<string>("")
  const [turnAnimation, setTurnAnimation] = useState<boolean>(false)
  const [invalidPlayAnimation, setInvalidPlayAnimation] = useState<boolean>(false)

  // 增强的动画效果
  const triggerClickAnimation = useCallback((cardId: string) => {
    setClickAnimation(cardId)
    setTimeout(() => setClickAnimation(""), 300)
  }, [])

  const triggerTurnAnimation = useCallback(() => {
    setTurnAnimation(true)
    setTimeout(() => setTurnAnimation(false), 2000)
  }, [])

  const triggerInvalidPlayAnimation = useCallback(() => {
    setInvalidPlayAnimation(true)
    setTimeout(() => setInvalidPlayAnimation(false), 500)
  }, [])
  const [showStats, setShowStats] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [isManualSort, setIsManualSort] = useState(false) // 跟踪是否手动排序
  // 安全的定时器和订阅管理
  const { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout } = useSafeTimer()
  const { addSubscription } = useSafeSupabaseSubscription()
  const supabase = createClient()
  
  // 智能数据同步 - 优化手牌保存
  const { save: saveCardsSmartly } = useSmartDataSync(async (cards: GameCard[]) => {
    const { error } = await (supabase as any)
      .from("players")
      .update({ cards })
      .eq("game_id", gameId)
      .eq("player_name", playerName)
    
    if (error) {
      console.error('Error saving cards:', error)
      throw error
    }
  }, 2000) // 2秒防抖

  // 主题控制
  const { currentTheme, changeTheme } = useTheme()

  // 错误处理
  const { handleGameError, handleNetworkError, showSuccess, showLoading, dismissLoading } = useErrorHandler()
  
  // 音效
  const { playClickSound, playSuccessSound, playErrorSound, backgroundMusic, toggleBackgroundMusic } = useSoundEffects()

  // 计算是否是我的回合
  const isMyTurn = gameState && myPosition !== -1 && gameState.currentPlayer === myPosition

  // 拖拽传感器
  // 移动端传感器配置优化
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 增加激活距离，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 重连功能
  const { isConnected, isReconnecting, manualReconnect } = useReconnect({
    onReconnect: () => {
      fetchGameData()
    },
    onDisconnect: () => {
        handleNetworkError(new Error('连接断开'))
      }
  })

  // 计时器功能 - 使用安全的定时器防止内存泄漏
  useEffect(() => {
    if (turnTimer && timeRemaining > 0) {
      const timer = safeSetTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // 时间到，根据设置决定是自动出牌还是跳过
            if (gameOptions.autoPass) {
              handleAutoPlay()
            } else {
              handlePass()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => safeClearTimeout(timer)
    }
  }, [turnTimer, timeRemaining, safeSetTimeout, safeClearTimeout, gameOptions.autoPass])

  // 根据游戏速度获取计时器时长
  const getTimerDuration = (speed: string) => {
    switch(speed) {
      case 'slow': return 30    // 慢速：30秒
      case 'normal': return 15  // 正常：15秒
      case 'fast': return 10    // 快速：10秒
      default: return 15        // 默认：15秒
    }
  }

  // 开始计时器
  const startTurnTimer = (customSeconds?: number) => {
    const seconds = customSeconds || getTimerDuration(gameOptions.gameSpeed)
    setTimeRemaining(seconds)
    setTurnTimer(Date.now())
  }

  // 停止计时器
  const stopTurnTimer = () => {
    setTurnTimer(null)
    setTimeRemaining(0)
  }

  // 生成出牌提示
  const generateCardHints = useCallback(() => {
    if (!gameState || !isMyTurn) {
      setCardHints([])
      return
    }
    
    const hints = getCardHints(myCards, gameState?.lastPlay, players?.length ?? 0)
    setCardHints(hints)
  }, [myCards, gameState, isMyTurn, players?.length])

  // 应用提示
  const applyHint = (hint: CardHint) => {
    setSelectedCards(hint.cards)
    setShowHints(false)
  }

  // 获取游戏数据
  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // 并行获取游戏信息、玩家和游戏状态数据
      const [gameResult, playersResult, gameStateResult] = await Promise.all([
        supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single() as any,
        supabase
          .from("players")
          .select("*")
          .eq("game_id", gameId)
          .order("position") as any,
        supabase
          .from("game_state")
          .select("*")
          .eq("game_id", gameId)
          .single() as any
      ])

      if (playersResult.error) throw playersResult.error
      
      // 同步游戏选项
      if (gameResult.data?.game_options) {
        setGameOptions(gameResult.data.game_options)
      }
      
      const playersData = playersResult.data || []
      const gameStateData = gameStateResult.data

      // 转换玩家数据格式
      const playersList = playersData.map((p: any) => ({
        id: p.id,
        name: p.player_name,
        position: p.position,
        cards: p.cards || [],
        isSpectator: p.is_spectator,
      }))

      // 如果游戏状态不存在，说明游戏还没开始
      if (gameStateResult.error) {
        if (gameStateResult.error.code === 'PGRST116') {
          console.log("Game state not found, game not started yet")
          setGameState(null)
          setPlayers(playersList)
          setIsLoading(false)
          return
        } else {
          console.error("Error fetching game state:", gameStateResult.error)
          // Don't throw error for 406 or other client errors, just log and continue
          if ((gameStateResult.error as any).status === 406) {
            console.log("Game state table not accessible, game not started yet")
            setGameState(null)
            setPlayers(playersList)
            setIsLoading(false)
            return
          }
          throw gameStateResult.error
        }
      }

      // 批量更新状态，避免多次渲染
      const newState = {
        players: playersList,
        gameState: gameStateData ? {
          id: (gameStateData as any).id,
          currentPlayer: (gameStateData as any).current_player,
          lastPlay: (gameStateData as any).last_play || [],
          lastPlayer: (gameStateData as any).last_player,
          turnCount: (gameStateData as any).turn_count,
          playHistory: (gameStateData as any).play_history || [],
        } : null
      }

      setPlayers(newState.players)
      if (newState.gameState) {
        setGameState(newState.gameState)
      }

      // 检查获胜者
      const winner = playersList.find((p: any) => p.cards.length === 0)
      if (winner && !gameWinner) {
        setGameWinner(winner.name)
        playSuccessSound() // 播放获胜音效
        // Update game status to finished
        // @ts-ignore
        await supabase.from("games").update({ status: "finished" }).eq("id", gameId)
      }

      // 找到当前玩家的位置和手牌
      // 添加检查确保playerName不为空
      if (playerName && playerName.trim() !== '') {
        const myPlayer = playersData.find((p: any) => p.player_name === playerName)
        if (myPlayer) {
          console.log('Found my player:', {
            name: myPlayer.player_name,
            position: myPlayer.position,
            cards: myPlayer.cards?.length || 0
          })
          setMyPosition(myPlayer.position)
          setIsHost(myPlayer.position === 0) // Host is player with position 0
          
          // 只有在非手动排序时才重新排序手牌
          if (!isManualSort) {
            let sortedCards = myPlayer.cards || []
            if (gameOptions.autoArrange) {
              sortedCards = autoArrangeCards(sortedCards)
            } else {
              sortedCards = sortCards(sortedCards, gameOptions.cardSorting)
            }
            setMyCards(sortedCards)
          } else {
            // 手动排序时，只更新手牌数量，保持当前顺序
            setMyCards(prevCards => {
              // 如果手牌数量发生变化（比如出牌后），则更新
              if (prevCards.length !== myPlayer.cards?.length) {
                return myPlayer.cards || []
              }
              return prevCards
            })
          }
          
          // 如果是我的回合，启动计时器
          if (newState.gameState && newState.gameState.currentPlayer === myPlayer.position) {
            startTurnTimer() // 使用游戏速度设置的时长
          } else {
            stopTurnTimer()
          }
          
          // 生成出牌提示
          generateCardHints()
        } else {
          console.log('My player not found:', {
            playerName,
            allPlayers: playersData.map((p: any) => ({ name: p.player_name, position: p.position }))
          })
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching game data:", error)
        handleGameError(error, "获取游戏数据失败")
      setIsLoading(false)
    }
  }, [gameId, playerName, gameOptions.autoArrange, gameOptions.cardSorting, gameWinner, isManualSort])

  useEffect(() => {
    // Subscribe to game updates - 使用安全的订阅管理
    const channel = supabase
      .channel(`game-${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, () =>
        fetchGameData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state", filter: `game_id=eq.${gameId}` },
        () => fetchGameData(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          // 实时同步游戏选项变更
          if (payload.new && (payload.new as any).game_options) {
            setGameOptions((payload.new as any).game_options)
          }
        }
      )
      .subscribe()

    // 将订阅添加到管理器中
    addSubscription({
      unsubscribe: () => supabase.removeChannel(channel)
    })

    // Initial data fetch
    fetchGameData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, playerName, fetchGameData, addSubscription])

  // 保存手牌到数据库的辅助函数 - 已被智能同步取代
  const saveCardsToDatabase = async (cards: GameCard[], action: string) => {
    try {
      saveCardsSmartly(cards) // 使用智能同步，自动防抖和去重
      showSuccess(`${action}完成`)
      return true
    } catch (error) {
      console.error(`Error saving cards after ${action}:`, error)
      handleGameError(error, `保存${action}失败`)
      return false
    }
  }

  // 处理拖拽结束 - 优化版本
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // 优化索引查找，避免重复计算
      const activeId = active.id as string
      const overId = over?.id as string
      
      const oldIndex = myCards.findIndex((card, index) => 
        `${card.suit}-${card.rank}` === activeId.split('-').slice(0, 2).join('-')
      )
      const newIndex = myCards.findIndex((card, index) => 
        `${card.suit}-${card.rank}` === overId?.split('-').slice(0, 2).join('-')
      )

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCards = arrayMove(myCards, oldIndex, newIndex)
        setMyCards(newCards)
        setIsManualSort(true) // 标记为手动排序
        
        // 使用防抖保存，避免频繁数据库操作
        saveCardsSmartly(newCards)
      }
    }
  }

  const handleCardClick = useCallback((card: GameCard) => {
    // 播放点击音效
    playClickSound()
    
    // 触发点击动画
    triggerClickAnimation(`${card.suit}-${card.rank}`)
    
    // 添加点击反馈动画
    requestAnimationFrame(() => {
      const cardElement = document.querySelector(`[data-card-id="${card.suit}-${card.rank}"]`)
      if (cardElement) {
        cardElement.classList.add('enhanced-button-feedback')
        setTimeout(() => {
          cardElement.classList.remove('enhanced-button-feedback')
        }, 300)
      }
    })

    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.suit === card.suit && c.rank === card.rank)
      if (isSelected) {
        return prev.filter(c => !(c.suit === card.suit && c.rank === card.rank))
      } else {
        return [...prev, card]
      }
    })
  }, [triggerClickAnimation, playClickSound])

  // 智能自动出牌
  const handleAutoPlay = async () => {
    if (!gameState) return

    try {
      // 检查是否应该自动跳过
      if (shouldAutoPass(myCards, gameState.lastPlay, players.length)) {
        await handlePass()
        return
      }

      // 获取智能出牌建议
      const suggestedCards = getAutoPlaySuggestion(myCards, gameState.lastPlay, players.length)
      
      if (!suggestedCards || suggestedCards.length === 0) {
        await handlePass()
        return
      }

      // 自动选择建议的牌并出牌
      setSelectedCards(suggestedCards)
      
      // 延迟一点时间让用户看到选择的牌，然后自动出牌
      setTimeout(async () => {
        // 验证出牌
        const remainingCards = myCards.filter(
          (card) => !suggestedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
        )

        if (!isValidPlay(suggestedCards, gameState.lastPlay, players.length, remainingCards)) {
          await handlePass()
          return
        }

        // 执行出牌逻辑（复用handlePlay的逻辑）
        const newCards = myCards.filter(
          (card) => !suggestedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
        )

        // 更新玩家手牌
        // @ts-ignore
        const { error: playerError } = await supabase
          .from("players")
          // @ts-ignore
          .update({ cards: newCards })
          .eq("game_id", gameId)
          .eq("player_name", playerName)

        if (playerError) {
          console.error("Error updating player cards:", playerError)
          toast.error("自动出牌失败")
          return
        }

        // 更新游戏状态
        const nextPlayer = (gameState.currentPlayer + 1) % players.length
        const playHistory = gameState.playHistory || []
        const newPlayHistory = [
          ...playHistory,
          {
            turn: gameState.turnCount + 1,
            playerName: playerName,
            playerPosition: myPosition,
            cards: suggestedCards,
            playType: getPlayTypeName(suggestedCards),
            timestamp: new Date().toISOString(),
          }
        ]
        
        // @ts-ignore
        const { error: gameStateError } = await supabase
          .from("game_state")
          // @ts-ignore
          .update({
            current_player: nextPlayer,
            last_play: suggestedCards,  // 确保正确更新last_play
            last_player: myPosition,
            turn_count: gameState.turnCount + 1,
            play_history: newPlayHistory,
            updated_at: new Date().toISOString(),
          })
          .eq("game_id", gameId)

        if (gameStateError) {
          console.error("Error updating game state:", gameStateError)
          toast.error("更新游戏状态失败")
          return
        }

        setSelectedCards([])
        stopTurnTimer()
        playSuccessSound()
        showSuccess("自动出牌成功！")
      }, 1000) // 1秒延迟让用户看到选择的牌
      
    } catch (error) {
      console.error("Error in auto play:", error)
      toast.error("自动出牌失败，改为跳过")
      await handlePass()
    }
  }

  const handlePlay = async () => {
    if (!gameState || selectedCards.length === 0) return

    try {
      // Calculate remaining cards after this play
      const remainingCards = myCards.filter(
        (card) => !selectedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
      )

      // Validate play
      if (!isValidPlay(selectedCards, gameState.lastPlay, players.length, remainingCards)) {
        triggerInvalidPlayAnimation()
        playErrorSound()
        if (remainingCards.length === 1 && remainingCards[0].suit === "spades") {
          toast.error("不能留下单张♠作为最后一张牌！")
        } else {
          toast.error("出牌无效！请选择有效的牌型")
        }
        return
      }

      // Update player's cards
      const newCards = myCards.filter(
        (card) => !selectedCards.some((selected) => selected.suit === card.suit && selected.rank === card.rank),
      )

      // Update player
      // @ts-ignore
      const { error: playerError } = await supabase
        .from("players")
        // @ts-ignore
        .update({ cards: newCards })
        .eq("game_id", gameId)
        .eq("player_name", playerName)

      if (playerError) {
        console.error("Error updating player cards:", playerError)
        toast.error("更新手牌失败")
        return
      }

      // Update game state with history
      const nextPlayer = (gameState.currentPlayer + 1) % players.length
      const playHistory = gameState.playHistory || []
      const newPlayHistory = [
        ...playHistory,
        {
          turn: gameState.turnCount + 1,
          playerName: playerName,
          playerPosition: myPosition,
          cards: selectedCards,
          playType: getPlayTypeName(selectedCards),
          timestamp: new Date().toISOString(),
        }
      ]
      
      // @ts-ignore
      const { error: gameStateError } = await supabase
        .from("game_state")
        // @ts-ignore
        .update({
          current_player: nextPlayer,
          last_play: selectedCards,  // 确保正确更新last_play
          last_player: myPosition,
          turn_count: gameState.turnCount + 1,
          play_history: newPlayHistory,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      if (gameStateError) {
        console.error("Error updating game state:", gameStateError)
        toast.error("更新游戏状态失败")
        return
      }

      setSelectedCards([])
      stopTurnTimer() // 停止计时器
      playSuccessSound() // 播放成功音效
      showSuccess("出牌成功！")
    } catch (error) {
      console.error("Error playing cards:", error)
      toast.error("出牌失败，请重试")
    }
  }

  const handlePass = async () => {
    if (!gameState) return

    try {
      const nextPlayer = (gameState.currentPlayer + 1) % players.length
      // @ts-ignore
      const { error } = await supabase
        .from("game_state")
        // @ts-ignore
        .update({
          current_player: nextPlayer,
          turn_count: gameState.turnCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      if (error) {
        console.error("Error passing turn:", error)
        toast.error("跳过回合失败")
        return
      }

      stopTurnTimer() // 停止计时器
      toast.success("已跳过回合")
    } catch (error) {
      console.error("Error passing turn:", error)
      toast.error("跳过回合失败，请重试")
    }
  }

  const startNewGame = async () => {
    const loadingToast = toast.loading("正在开始新游戏...")
    
    try {
      // 重置游戏状态
      setGameWinner(null)
      setSelectedCards([])
      
      // 创建新牌组并发牌
      const deck = createDeck()
      const shuffledDeck = deck.sort(() => Math.random() - 0.5)
      const hands = dealCards(shuffledDeck, players.length)

      // 更新每个玩家的手牌
      for (let i = 0; i < players.length; i++) {
        // @ts-ignore
        await supabase
          .from("players")
          // @ts-ignore
          .update({ cards: hands[i] })
          .eq("game_id", gameId)
          .eq("position", i)
      }

      // 重置游戏状态
      // @ts-ignore
      await supabase
        .from("game_state")
        // @ts-ignore
        .update({
          current_player: 0,
          last_play: [],
          last_player: null,
          turn_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId)

      // 更新游戏状态为进行中
      // @ts-ignore
      await supabase
        .from("games")
        // @ts-ignore
        .update({ status: "in_progress" })  // 修复：使用下划线而不是连字符
        .eq("id", gameId)

      toast.dismiss(loadingToast)
      toast.success("新游戏开始！")
      
      // 刷新游戏数据
      fetchGameData()
    } catch (error) {
      console.error("Error starting new game:", error)
      toast.dismiss(loadingToast)
      toast.error("开始新游戏失败，请重试")
    }
  }

  const endGame = async () => {
    const loadingToast = toast.loading("正在结束游戏...")
    
    try {
      // Update game status to finished
      // @ts-ignore
      const { error: updateGameError } = await supabase
        .from("games")
        // @ts-ignore
        .update({ status: "finished" })
        .eq("id", gameId)
      
      if (updateGameError) {
        console.error("Error ending game:", updateGameError)
        throw updateGameError
      }
      
      toast.dismiss(loadingToast)
      toast.success("游戏已结束")
      
      // Refresh game data
      await fetchGameData()
    } catch (error) {
      console.error("Error ending game:", error)
      toast.dismiss(loadingToast)
      toast.error("结束游戏失败，请重试")
    }
  }

  // Show game start message if game just started (only show briefly)
  useEffect(() => {
    // 只有在游戏真正刚开始时（turnCount为0且之前没有显示过）才显示游戏开始消息
    if (gameState && gameState.turnCount === 0 && myCards.length > 0 && !showGameStart) {
      setShowGameStart(true)
      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        setShowGameStart(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.turnCount, myCards.length, showGameStart])

  // Debug logging
  console.log('GameTable Debug:', {
    gameState: gameState ? {
      currentPlayer: gameState.currentPlayer,
      turnCount: gameState.turnCount,
      lastPlay: gameState.lastPlay
    } : null,
    myPosition,
    playerName,
    isMyTurn,
    playersCount: players.length
  })

  if (isLoading) {
    return <GameTableSkeleton />
  }

  if (showGameStart) {
    return (
      <div className={`min-h-screen ${currentTheme.tableStyle.background} flex items-center justify-center`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-2xl font-bold mb-4">游戏开始！</h1>
            <p className="text-gray-600 mb-6">手牌已自动发牌，准备开始游戏！</p>
            <div className="text-sm text-gray-500 mb-6">
              {players.length < 4 ? "2-3人模式：需要从♦3开始" : "4人模式：可以任意组合开始"}
            </div>
            <div className="text-xs text-gray-400">
              3秒后自动进入游戏...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show winner screen
  if (gameWinner) {
    return (
      <div className={`min-h-screen ${currentTheme.tableStyle.background} flex items-center justify-center`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">游戏结束！</h1>
            <p className="text-xl text-gray-600 mb-6">获胜者: {gameWinner}</p>
            <div className="space-y-3">
              <Button onClick={startNewGame} className="w-full">
                开始新游戏
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">返回大厅</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <GameLayout
      gameState={gameState}
      players={players}
      myPosition={myPosition}
      myCards={myCards}
      selectedCards={selectedCards}
      isMyTurn={isMyTurn}
      isHost={isHost}
      timeRemaining={timeRemaining}
      isConnected={isConnected}
      isReconnecting={isReconnecting}
      backgroundMusic={backgroundMusic}
      currentTheme={currentTheme}
      gameOptions={gameOptions}
      showHints={showHints}
      cardHints={cardHints}
      showOptions={showOptions}
      showStats={showStats}
      showThemeSelector={showThemeSelector}
      clickAnimation={clickAnimation}
      sensors={sensors}
      onCardClick={handleCardClick}
      onDragEnd={handleDragEnd}
      onPlay={handlePlay}
      onPass={handlePass}
      onToggleHints={() => setShowHints(!showHints)}
      onApplyHint={applyHint}
      onSortCards={(type) => {
        const sorted = type === 'auto' ? autoArrangeCards(myCards) : sortCards(myCards, type)
        setMyCards(sorted)
        setIsManualSort(true)
      }}
      onStartNewGame={startNewGame}
      onEndGame={endGame}
      onToggleBackgroundMusic={toggleBackgroundMusic}
      onShowStats={() => setShowStats(true)}
      onShowThemeSelector={() => setShowThemeSelector(true)}
      onShowOptions={() => setShowOptions(true)}
      onManualReconnect={manualReconnect}
      onCloseOptions={() => setShowOptions(false)}
      onCloseStats={() => setShowStats(false)}
      onCloseThemeSelector={() => setShowThemeSelector(false)}
      onSaveGameOptions={setGameOptions}
      onThemeChange={changeTheme}
      gameId={gameId}
      playerName={playerName}
    />
  )
}