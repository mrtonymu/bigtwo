// lib/utils/optimized-queries.ts
// 优化的数据库查询模块

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { smartCache } from './smart-cache';
import { ErrorHandler, ErrorCode } from './error-handler';

// 初始化Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 重试配置
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 带重试机制的查询函数
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= retryConfig.maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次重试，抛出错误
      if (i === retryConfig.maxRetries) {
        throw error;
      }
      
      // 计算延迟时间
      const delayTime = retryConfig.exponentialBackoff 
        ? retryConfig.retryDelay * Math.pow(2, i)
        : retryConfig.retryDelay;
      
      console.warn(`Query failed, retrying in ${delayTime}ms... (attempt ${i + 1}/${retryConfig.maxRetries + 1})`);
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

// 获取游戏数据（带缓存）
export async function getGameData(gameId: string, useCache: boolean = true) {
  const cacheKey = `game:${gameId}`;
  
  // 检查缓存
  if (useCache) {
    const cachedData = smartCache.get<Database['public']['Tables']['games']['Row']>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '获取游戏数据');
      throw error;
    }
    
    // 缓存数据
    if (useCache && data) {
      smartCache.set(cacheKey, data, 30000); // 缓存30秒
    }
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '获取游戏数据');
    throw error;
  }
}

// 获取玩家数据（带缓存）
export async function getPlayersData(gameId: string, useCache: boolean = true) {
  const cacheKey = `players:${gameId}`;
  
  // 检查缓存
  if (useCache) {
    const cachedData = smartCache.get<Database['public']['Tables']['players']['Row'][]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('position');
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '获取玩家数据');
      throw error;
    }
    
    // 缓存数据
    if (useCache && data) {
      smartCache.set(cacheKey, data, 20000); // 缓存20秒
    }
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '获取玩家数据');
    throw error;
  }
}

// 获取游戏状态数据（带缓存）
export async function getGameStateData(gameId: string, useCache: boolean = true) {
  const cacheKey = `game_state:${gameId}`;
  
  // 检查缓存
  if (useCache) {
    const cachedData = smartCache.get<Database['public']['Tables']['game_state']['Row']>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '获取游戏状态数据');
      throw error;
    }
    
    // 缓存数据
    if (useCache && data) {
      smartCache.set(cacheKey, data, 15000); // 缓存15秒
    }
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '获取游戏状态数据');
    throw error;
  }
}

// 获取玩家手牌数据（带缓存）
export async function getPlayerCardsData(playerId: string, useCache: boolean = true) {
  const cacheKey = `player_cards:${playerId}`;
  
  // 检查缓存
  if (useCache) {
    const cachedData = smartCache.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('players')
        .select('cards')
        .eq('id', playerId)
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '获取玩家手牌数据');
      throw error;
    }
    
    // 缓存数据
    if (useCache && data) {
      smartCache.set(cacheKey, data.cards, 10000); // 缓存10秒
    }
    
    return data?.cards || [];
  } catch (error) {
    ErrorHandler.handle(error, '获取玩家手牌数据');
    throw error;
  }
}

// 获取出牌历史（从游戏状态中获取）
export async function getPlayHistoryData(gameId: string, limit: number = 50, useCache: boolean = true) {
  const cacheKey = `play_history:${gameId}:${limit}`;
  
  // 检查缓存
  if (useCache) {
    const cachedData = smartCache.get<any[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('play_history')
        .eq('game_id', gameId)
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '获取出牌历史');
      throw error;
    }
    
    // 获取有限数量的历史记录
    const playHistory = data?.play_history || [];
    const limitedHistory = playHistory.slice(0, limit);
    
    // 缓存数据
    if (useCache && limitedHistory) {
      smartCache.set(cacheKey, limitedHistory, 30000); // 缓存30秒
    }
    
    return limitedHistory;
  } catch (error) {
    ErrorHandler.handle(error, '获取出牌历史');
    throw error;
  }
}

// 批量获取游戏相关数据
export async function getGameDataBatch(gameId: string, playerId: string) {
  try {
    // 并行获取所有数据
    const [gameData, playersData, gameStateData, handCardsData] = await Promise.all([
      getGameData(gameId),
      getPlayersData(gameId),
      getGameStateData(gameId),
      getPlayerCardsData(playerId)
    ]);
    
    return {
      game: gameData,
      players: playersData,
      gameState: gameStateData,
      handCards: handCardsData
    };
  } catch (error) {
    ErrorHandler.handle(error, '批量获取游戏数据');
    throw error;
  }
}

// 更新游戏数据（清除相关缓存）
export async function updateGameData(gameId: string, updates: any) {
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '更新游戏数据');
      throw error;
    }
    
    // 清除相关缓存
    smartCache.invalidateByDependency(`game:${gameId}`);
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '更新游戏数据');
    throw error;
  }
}

// 更新游戏状态（清除相关缓存）
export async function updateGameState(gameId: string, updates: any) {
  try {
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('game_state')
        .update(updates)
        .eq('game_id', gameId)
        .select()
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '更新游戏状态');
      throw error;
    }
    
    // 清除相关缓存
    smartCache.invalidateByDependency(`game_state:${gameId}`);
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '更新游戏状态');
    throw error;
  }
}

// 添加出牌记录到游戏状态
export async function addPlayHistory(gameId: string, playData: any) {
  try {
    // 首先获取当前的游戏状态
    const { data: gameState, error: fetchError } = await supabase
      .from('game_state')
      .select('play_history')
      .eq('game_id', gameId)
      .single();
    
    if (fetchError) {
      ErrorHandler.handleSupabaseError(fetchError, '获取游戏状态');
      throw fetchError;
    }
    
    // 更新出牌历史
    const updatedPlayHistory = [...(gameState?.play_history || []), playData];
    
    // 更新游戏状态
    const result: any = await queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('game_state')
        .update({ play_history: updatedPlayHistory })
        .eq('game_id', gameId)
        .select()
        .single();
      return { data, error };
    });
    
    const { data, error } = result;
    
    if (error) {
      ErrorHandler.handleSupabaseError(error, '更新出牌历史');
      throw error;
    }
    
    // 清除相关缓存
    smartCache.invalidateByDependency(`play_history:${gameId}`);
    
    return data;
  } catch (error) {
    ErrorHandler.handle(error, '添加出牌记录');
    throw error;
  }
}

// 订阅游戏状态变化
export function subscribeToGameState(
  gameId: string, 
  callback: (payload: any) => void
) {
  try {
    const subscription = supabase
      .channel(`game_state:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          // 清除相关缓存
          smartCache.invalidateByDependency(`game_state:${gameId}`);
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  } catch (error) {
    ErrorHandler.handle(error, '订阅游戏状态');
    throw error;
  }
}

// 订阅玩家数据变化
export function subscribeToPlayers(
  gameId: string, 
  callback: (payload: any) => void
) {
  try {
    const subscription = supabase
      .channel(`players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          // 清除相关缓存
          smartCache.invalidateByDependency(`players:${gameId}`);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          // 清除相关缓存
          smartCache.invalidateByDependency(`players:${gameId}`);
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  } catch (error) {
    ErrorHandler.handle(error, '订阅玩家数据');
    throw error;
  }
}

// 导出工具函数
export {
  queryWithRetry,
  delay
};