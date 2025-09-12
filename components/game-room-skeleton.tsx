import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function GameRoomSkeleton() {
  return (
    <Card className="game-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 表头骨架 */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* 房间列表骨架 */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 items-center py-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function GameTableSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-16" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* 游戏状态骨架 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 玩家卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <div className="flex justify-center items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 最后出牌骨架 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-20 mx-auto mb-3" />
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-12" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 玩家手牌骨架 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Array.from({ length: 13 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-14" />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
