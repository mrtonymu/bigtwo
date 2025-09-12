import { WerewolfLobby } from "@/components/werewolf-lobby"
import { AppWrapper } from "@/components/app-wrapper"

export default function WerewolfPage() {
  return (
    <AppWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <WerewolfLobby />
        </div>
      </div>
    </AppWrapper>
  )
}
