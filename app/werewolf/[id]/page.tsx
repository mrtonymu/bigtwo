"use client"

import { Suspense } from "react"
import { WerewolfGameComponent } from "@/components/werewolf-game"

interface WerewolfGamePageProps {
  params: {
    id: string
  }
  searchParams: {
    player?: string
    spectator?: string
  }
}

export default function WerewolfGamePage({ params, searchParams }: WerewolfGamePageProps) {
  const playerName = searchParams.player || ""
  const isSpectator = searchParams.spectator === "true"

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>加载狼人杀游戏中...</p>
        </div>
      </div>
    }>
      <WerewolfGameComponent 
        gameId={params.id} 
        playerName={playerName}
      />
    </Suspense>
  )
}
