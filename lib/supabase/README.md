# Supabase 操作层使用指南

## 概述

这个操作层解决了项目中的 Supabase 客户端类型配置问题，提供了类型安全的数据库操作接口。

## 设计原则

根据项目规范要求：
- ✅ **类型安全实践** - 对外提供完全类型安全的接口
- ✅ **统一错误处理** - 使用统一的错误处理系统
- ✅ **内存泄漏防护** - 正确管理实时订阅和资源
- ✅ **性能优化** - 支持批量操作和并发请求

## 核心特性

### 1. 解决 Supabase 类型推断问题
```typescript
// 内部使用 any 断言解决类型推断失败
const { data, error } = await (this.client as any)
  .from('games')
  .insert(gameData)

// 对外提供类型安全的返回值
return { data: data as Game, error: null }
```

### 2. 统一错误处理
```typescript
// 所有错误都通过 ErrorHandler 处理
if (error) {
  const handledError = ErrorHandler.handleSupabaseError(error, 'createGame')
  return { data: null, error: handledError }
}
```

### 3. 类型安全的响应接口
```typescript
interface SupabaseResponse<T> {
  data: T | null
  error: AppError | null
}
```

## 使用示例

### 基础操作

```typescript
import { supabaseOps } from '@/lib/supabase/operations'

// 创建游戏
const gameResult = await supabaseOps.createGame({
  name: "新游戏",
  status: "waiting",
  max_players: 4
})

if (gameResult.error) {
  console.error('创建游戏失败:', gameResult.error.message)
} else {
  console.log('游戏创建成功:', gameResult.data.id)
}

// 获取游戏详情（包含玩家和状态）
const detailsResult = await supabaseOps.getGameDetails(gameId)
if (detailsResult.data) {
  const { game, players, gameState } = detailsResult.data
  console.log(`游戏: ${game.name}, 玩家数: ${players.length}`)
}
```

### 批量操作

```typescript
// 批量更新玩家手牌（游戏初始化时使用）
const playersCards = [
  { position: 0, cards: hand1 },
  { position: 1, cards: hand2 },
  { position: 2, cards: hand3 },
  { position: 3, cards: hand4 }
]

const batchResult = await supabaseOps.updateAllPlayerCards(gameId, playersCards)
if (batchResult.success) {
  console.log('所有玩家手牌更新成功')
} else {
  console.error('部分更新失败:', batchResult.errors)
}
```

### 实时订阅

```typescript
// 订阅游戏状态变化
const subscription = supabaseOps.subscribeToGameState(gameId, (payload) => {
  console.log('游戏状态更新:', payload)
  // 更新 UI 状态
})

// 记得在组件卸载时取消订阅
useEffect(() => {
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

### 错误处理模式

```typescript
async function handleGameOperation() {
  const result = await supabaseOps.createGame(gameData)
  
  if (result.error) {
    // 错误已经被统一处理并显示给用户
    // 这里只需要处理业务逻辑
    return false
  }
  
  // 成功处理
  const game = result.data
  return true
}
```

## 与项目中其他代码的关系

### 替换现有的 (supabase as any) 用法

**之前:**
```typescript
const { data, error } = await (supabase as any)
  .from("players")
  .update({ cards })
  .eq("game_id", gameId)
  .eq("player_name", playerName)
```

**现在:**
```typescript
const result = await supabaseOps.updatePlayerCards(gameId, playerName, cards)
if (result.error) {
  // 统一的错误处理
} else {
  const player = result.data
  // 类型安全的数据访问
}
```

### 在 React 组件中使用

```typescript
import { supabaseOps } from '@/lib/supabase/operations'

function GameComponent() {
  const [game, setGame] = useState<Game | null>(null)
  
  useEffect(() => {
    async function loadGame() {
      const result = await supabaseOps.getGame(gameId)
      if (result.data) {
        setGame(result.data)
      }
    }
    
    loadGame()
  }, [gameId])
  
  // ...
}
```

## 性能优化建议

1. **使用批量操作** - 对于多个相关的数据库操作，使用 `updateAllPlayerCards` 等批量方法
2. **并发请求** - `getGameDetails` 方法内部使用 `Promise.allSettled` 并发获取数据
3. **智能订阅** - 只订阅必要的数据变化，及时取消不需要的订阅

## 连接健康检查

```typescript
// 检查数据库连接状态
const { connected, error } = await supabaseOps.checkConnection()
if (!connected) {
  console.error('数据库连接失败:', error)
}
```

## 总结

这个解决方案：
- ✅ 解决了 Supabase TypeScript 类型推断问题
- ✅ 提供了完全类型安全的外部接口
- ✅ 统一了错误处理机制
- ✅ 符合项目的所有技术规范
- ✅ 保持了与现有代码的兼容性
- ✅ 提供了性能优化的批量操作方法

现在你可以在整个项目中使用 `supabaseOps` 替换所有的 `(supabase as any)` 用法，获得更好的类型安全性和开发体验！