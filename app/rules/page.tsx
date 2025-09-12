import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">CNFLIX 使用说明</h1>
            <p className="text-muted-foreground">了解如何使用CNFLIX流媒体平台</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>平台介绍</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                CNFLIX是一个专业的流媒体播放平台，提供海量高清影视资源，包括电影、电视剧、综艺、动漫等各类内容。
                我们致力于为用户提供最优质的观影体验。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>主要功能</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>观影功能：</strong>
                </p>
                <p>• 高清视频播放</p>
                <p>• 多语言字幕支持</p>
                <p>• 播放历史记录</p>
                <p>• 收藏夹功能</p>
                <p>
                  <strong>内容分类：</strong>
                </p>
                <p>• 电影 - 最新院线大片</p>
                <p>• 电视剧 - 热播剧集</p>
                <p>• 综艺 - 娱乐节目</p>
                <p>• 动漫 - 动画作品</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>使用指南</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">如何开始观影</h4>
                  <p>1. 在首页选择您想观看的内容</p>
                  <p>2. 点击"立即播放"开始观看</p>
                  <p>3. 使用播放控制条调节音量、进度等</p>
                </div>
                <div>
                  <h4 className="font-semibold">个性化设置</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>调整视频画质（高清、超清、4K）</li>
                    <li>选择字幕语言（中文、英文、日文等）</li>
                    <li>设置播放速度（0.5x - 2.0x）</li>
                    <li>开启/关闭自动播放</li>
                    <li>设置夜间模式</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>1. Each player receives 13 cards</p>
                <p>2. The player with the 3 of Hearts starts (or lowest card)</p>
                <p>3. Players must play a higher combination of the same type</p>
                <p>4. If you can't or don't want to play, you pass</p>
                <p>5. When all other players pass, the last player to play starts a new round</p>
                <p>6. First player to empty their hand wins!</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button asChild>
              <Link href="/">Back to Game Lobby</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
