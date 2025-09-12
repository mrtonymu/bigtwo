import { GameLobby } from "@/components/game-lobby"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <GameLobby />
      </main>
    </div>
  )
}
