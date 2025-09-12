"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CNFLIXLogo } from "@/components/cnflix-logo"
import toast from "react-hot-toast"

interface PasswordProtectionProps {
  onPasswordCorrect: () => void
}

const CORRECT_PASSWORD = "今天睡老板 明天睡地板"

export function PasswordProtection({ onPasswordCorrect }: PasswordProtectionProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated (permanent)
    const isAuth = localStorage.getItem("cnflix_authenticated")
    if (isAuth === "true") {
      setIsAuthenticated(true)
      onPasswordCorrect()
    }
  }, [onPasswordCorrect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("cnflix_authenticated", "true")
      toast.success("密码正确！欢迎来到CNFLIX！")
      onPasswordCorrect()
    } else {
      toast.error("密码错误，请重试")
      setPassword("")
    }
    
    setIsLoading(false)
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CNFLIXLogo size="xl" />
          </div>
          <CardTitle className="text-2xl font-bold">CNFLIX 访问验证</CardTitle>
          <p className="text-muted-foreground">请输入访问密码以继续</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                访问密码
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="text-center"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? "验证中..." : "进入CNFLIX"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🎬 海量高清影视资源，每日更新，永久免费在线观看
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
