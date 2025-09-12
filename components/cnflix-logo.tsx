interface CNFLIXLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function CNFLIXLogo({ size = 'md', className = '' }: CNFLIXLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl', 
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* CNFLIX Logo - 模仿Netflix风格 */}
      <div className="relative">
        <div className="bg-red-600 text-white font-bold rounded px-2 py-1 transform -skew-x-12 shadow-lg">
          <span className="text-white font-black tracking-tight">CNFLIX</span>
        </div>
        {/* 红色装饰条 */}
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-red-500 rounded-full"></div>
      </div>
      {/* 电影图标 */}
      <span className={`${sizeClasses[size]} opacity-90`}>🎬</span>
    </div>
  )
}
