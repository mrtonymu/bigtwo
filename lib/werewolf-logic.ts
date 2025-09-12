// 狼人杀游戏逻辑
export interface WerewolfPlayer {
  id: string
  name: string
  role: WerewolfRole
  isAlive: boolean
  isProtected: boolean // 女巫保护
  isVoted: boolean // 是否被投票
  voteTarget?: string // 投票目标
}

export type WerewolfRole = 'werewolf' | 'seer' | 'witch' | 'hunter' | 'villager'

export interface WerewolfGame {
  id: string
  name: string
  players: WerewolfPlayer[]
  phase: 'waiting' | 'night' | 'day' | 'voting' | 'finished'
  dayCount: number
  nightActions: NightAction[]
  votes: Vote[]
  winner?: 'werewolves' | 'villagers'
  createdAt: string
  updatedAt: string
}

export interface NightAction {
  playerId: string
  action: 'kill' | 'check' | 'heal' | 'poison'
  targetId?: string
  day: number
}

export interface Vote {
  voterId: string
  targetId: string
  day: number
}

// 角色配置
export const WEREWOLF_ROLES = {
  werewolf: { name: '狼人', count: 2, description: '夜晚可以杀死一名玩家' },
  seer: { name: '预言家', count: 1, description: '夜晚可以查验一名玩家的身份' },
  witch: { name: '女巫', count: 1, description: '夜晚可以使用解药或毒药' },
  hunter: { name: '猎人', count: 1, description: '死亡时可以带走一名玩家' },
  villager: { name: '村民', count: 0, description: '没有特殊能力，白天投票' }
} as const

// 创建狼人杀游戏
export function createWerewolfGame(gameId: string, gameName: string, playerNames: string[]): WerewolfGame {
  if (playerNames.length < 4 || playerNames.length > 8) {
    throw new Error('狼人杀需要4-8名玩家')
  }

  // 分配角色
  const roles = assignRoles(playerNames.length)
  const players: WerewolfPlayer[] = playerNames.map((name, index) => ({
    id: `player_${index}`,
    name,
    role: roles[index],
    isAlive: true,
    isProtected: false,
    isVoted: false
  }))

  return {
    id: gameId,
    name: gameName,
    players,
    phase: 'waiting',
    dayCount: 0,
    nightActions: [],
    votes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 分配角色
function assignRoles(playerCount: number): WerewolfRole[] {
  const roles: WerewolfRole[] = []
  
  // 固定角色
  roles.push('werewolf', 'werewolf') // 2个狼人
  roles.push('seer') // 1个预言家
  roles.push('witch') // 1个女巫
  roles.push('hunter') // 1个猎人
  
  // 剩余玩家为村民
  const villagerCount = playerCount - 5
  for (let i = 0; i < villagerCount; i++) {
    roles.push('villager')
  }
  
  // 随机打乱
  return roles.sort(() => Math.random() - 0.5)
}

// 开始游戏
export function startWerewolfGame(game: WerewolfGame): WerewolfGame {
  return {
    ...game,
    phase: 'night',
    dayCount: 1,
    updatedAt: new Date().toISOString()
  }
}

// 夜晚行动
export function performNightAction(
  game: WerewolfGame,
  playerId: string,
  action: 'kill' | 'check' | 'heal' | 'poison',
  targetId?: string
): WerewolfGame {
  const player = game.players.find(p => p.id === playerId)
  if (!player || !player.isAlive) {
    throw new Error('玩家不存在或已死亡')
  }

  // 验证行动合法性
  if (!isValidNightAction(player.role, action)) {
    throw new Error('该角色无法执行此行动')
  }

  const nightAction: NightAction = {
    playerId,
    action,
    targetId,
    day: game.dayCount
  }

  return {
    ...game,
    nightActions: [...game.nightActions, nightAction],
    updatedAt: new Date().toISOString()
  }
}

// 验证夜晚行动
function isValidNightAction(role: WerewolfRole, action: string): boolean {
  switch (role) {
    case 'werewolf':
      return action === 'kill'
    case 'seer':
      return action === 'check'
    case 'witch':
      return action === 'heal' || action === 'poison'
    case 'hunter':
    case 'villager':
      return false // 夜晚无行动
    default:
      return false
  }
}

// 进入白天
export function enterDayPhase(game: WerewolfGame): WerewolfGame {
  // 处理夜晚行动结果
  const updatedGame = processNightActions(game)
  
  return {
    ...updatedGame,
    phase: 'day',
    updatedAt: new Date().toISOString()
  }
}

// 处理夜晚行动
function processNightActions(game: WerewolfGame): WerewolfGame {
  let updatedPlayers = [...game.players]
  const lastNightActions = game.nightActions.filter(action => action.day === game.dayCount)
  
  // 狼人杀人
  const killAction = lastNightActions.find(action => action.action === 'kill')
  if (killAction && killAction.targetId) {
    const target = updatedPlayers.find(p => p.id === killAction.targetId)
    if (target && !target.isProtected) {
      target.isAlive = false
    }
  }
  
  // 女巫救人
  const healAction = lastNightActions.find(action => action.action === 'heal')
  if (healAction && healAction.targetId) {
    const target = updatedPlayers.find(p => p.id === healAction.targetId)
    if (target) {
      target.isProtected = true
    }
  }
  
  // 女巫毒人
  const poisonAction = lastNightActions.find(action => action.action === 'poison')
  if (poisonAction && poisonAction.targetId) {
    const target = updatedPlayers.find(p => p.id === poisonAction.targetId)
    if (target) {
      target.isAlive = false
    }
  }
  
  return {
    ...game,
    players: updatedPlayers
  }
}

// 投票
export function vote(game: WerewolfGame, voterId: string, targetId: string): WerewolfGame {
  if (game.phase !== 'day' && game.phase !== 'voting') {
    throw new Error('当前阶段无法投票')
  }

  const voter = game.players.find(p => p.id === voterId)
  if (!voter || !voter.isAlive) {
    throw new Error('投票者不存在或已死亡')
  }

  const target = game.players.find(p => p.id === targetId)
  if (!target || !target.isAlive) {
    throw new Error('投票目标不存在或已死亡')
  }

  // 移除之前的投票
  const updatedVotes = game.votes.filter(vote => vote.voterId !== voterId)
  
  // 添加新投票
  const newVote: Vote = {
    voterId,
    targetId,
    day: game.dayCount
  }

  return {
    ...game,
    votes: [...updatedVotes, newVote],
    phase: 'voting',
    updatedAt: new Date().toISOString()
  }
}

// 结束投票
export function endVoting(game: WerewolfGame): WerewolfGame {
  const alivePlayers = game.players.filter(p => p.isAlive)
  const lastDayVotes = game.votes.filter(vote => vote.day === game.dayCount)
  
  // 统计投票
  const voteCount: { [playerId: string]: number } = {}
  lastDayVotes.forEach(vote => {
    voteCount[vote.targetId] = (voteCount[vote.targetId] || 0) + 1
  })
  
  // 找出得票最多的玩家
  let maxVotes = 0
  let eliminatedPlayerId: string | null = null
  
  Object.entries(voteCount).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      eliminatedPlayerId = playerId
    }
  })
  
  let updatedPlayers = [...game.players]
  
  // 淘汰玩家
  if (eliminatedPlayerId) {
    const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedPlayerId)
    if (eliminatedPlayer) {
      eliminatedPlayer.isAlive = false
      
      // 如果是猎人，可以带走一名玩家
      if (eliminatedPlayer.role === 'hunter') {
        // 这里需要玩家选择，暂时随机选择
        const aliveEnemies = updatedPlayers.filter(p => p.isAlive && p.role !== 'hunter')
        if (aliveEnemies.length > 0) {
          const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
          randomTarget.isAlive = false
        }
      }
    }
  }
  
  // 检查游戏是否结束
  const werewolves = updatedPlayers.filter(p => p.isAlive && p.role === 'werewolf')
  const villagers = updatedPlayers.filter(p => p.isAlive && p.role !== 'werewolf')
  
  let winner: 'werewolves' | 'villagers' | undefined
  if (werewolves.length === 0) {
    winner = 'villagers'
  } else if (werewolves.length >= villagers.length) {
    winner = 'werewolves'
  }
  
  return {
    ...game,
    players: updatedPlayers,
    phase: winner ? 'finished' : 'night',
    dayCount: winner ? game.dayCount : game.dayCount + 1,
    winner,
    updatedAt: new Date().toISOString()
  }
}

// 获取游戏状态
export function getGameStatus(game: WerewolfGame) {
  const alivePlayers = game.players.filter(p => p.isAlive)
  const werewolves = alivePlayers.filter(p => p.role === 'werewolf')
  const villagers = alivePlayers.filter(p => p.role !== 'werewolf')
  
  return {
    phase: game.phase,
    dayCount: game.dayCount,
    alivePlayers,
    werewolves,
    villagers,
    winner: game.winner,
    isGameOver: !!game.winner
  }
}

// 获取玩家可见信息
export function getPlayerInfo(game: WerewolfGame, playerId: string) {
  const player = game.players.find(p => p.id === playerId)
  if (!player) return null
  
  const status = getGameStatus(game)
  
  return {
    player,
    gamePhase: game.phase,
    dayCount: game.dayCount,
    alivePlayers: status.alivePlayers.map(p => ({
      id: p.id,
      name: p.name,
      isAlive: p.isAlive,
      role: p.id === playerId ? p.role : undefined // 只显示自己的角色
    })),
    nightActions: game.nightActions.filter(action => 
      action.playerId === playerId || 
      (player.role === 'seer' && action.action === 'check')
    ),
    votes: game.votes.filter(vote => vote.day === game.dayCount)
  }
}
