-- =====================================================
-- 完整的游戏数据库设置脚本
-- 包含大二游戏和狼人杀游戏的所有表结构、索引、约束和优化
-- =====================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 核心游戏表结构 (大二游戏)
-- =====================================================

-- 游戏房间表
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_progress, finished
  max_players INTEGER NOT NULL DEFAULT 4,
  current_players INTEGER NOT NULL DEFAULT 0,
  spectators INTEGER NOT NULL DEFAULT 0,
  password TEXT, -- 房间密码 (可选)
  created_by TEXT, -- 创建者名称
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_max_players CHECK (max_players BETWEEN 2 AND 4),
  CONSTRAINT check_current_players CHECK (current_players >= 0 AND current_players <= max_players),
  CONSTRAINT check_spectators CHECK (spectators >= 0),
  CONSTRAINT check_status CHECK (status IN ('waiting', 'in_progress', 'finished', 'cancelled'))
);

-- 玩家表
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  position INTEGER NOT NULL, -- 0, 1, 2, 3 for 4 players
  cards JSONB DEFAULT '[]', -- 玩家手牌
  is_spectator BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE, -- 准备状态
  score INTEGER DEFAULT 0, -- 游戏得分
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_position CHECK (position >= 0 AND position < 4),
  CONSTRAINT unique_player_position UNIQUE (game_id, position),
  CONSTRAINT unique_player_name_per_game UNIQUE (game_id, player_name)
);

-- 游戏状态表
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_player INTEGER NOT NULL DEFAULT 0,
  last_play JSONB DEFAULT '[]', -- 上次出的牌
  last_player INTEGER,
  deck JSONB DEFAULT '[]', -- 剩余牌堆
  turn_count INTEGER DEFAULT 0,
  game_rules JSONB DEFAULT '{}', -- 游戏规则设置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_current_player CHECK (current_player >= 0 AND current_player < 4),
  CONSTRAINT check_turn_count CHECK (turn_count >= 0),
  CONSTRAINT unique_game_state UNIQUE (game_id) -- 每个游戏只有一个状态记录
);

-- =====================================================
-- 2. 狼人杀游戏表结构
-- =====================================================

-- 狼人杀游戏表
CREATE TABLE IF NOT EXISTS werewolf_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  players JSONB NOT NULL DEFAULT '[]',
  phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
  day_count INTEGER NOT NULL DEFAULT 0,
  night_actions JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '[]',
  winner VARCHAR(20),
  max_players INTEGER NOT NULL DEFAULT 12,
  current_players INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_werewolf_max_players CHECK (max_players BETWEEN 6 AND 20),
  CONSTRAINT check_werewolf_current_players CHECK (current_players >= 0 AND current_players <= max_players),
  CONSTRAINT check_werewolf_phase CHECK (phase IN ('waiting', 'day', 'night', 'voting', 'finished')),
  CONSTRAINT check_day_count CHECK (day_count >= 0)
);

-- =====================================================
-- 3. 游戏历史和统计表
-- =====================================================

-- 游戏历史记录表
CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  game_type TEXT NOT NULL, -- 'bigtwo' or 'werewolf'
  players JSONB NOT NULL,
  winner TEXT,
  duration_minutes INTEGER,
  final_scores JSONB,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_game_type CHECK (game_type IN ('bigtwo', 'werewolf')),
  CONSTRAINT check_duration CHECK (duration_minutes > 0)
);

-- 玩家统计表
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  avg_score DECIMAL(10,2) DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 数据约束
  CONSTRAINT check_stats_game_type CHECK (game_type IN ('bigtwo', 'werewolf')),
  CONSTRAINT check_games_played CHECK (games_played >= 0),
  CONSTRAINT check_games_won CHECK (games_won >= 0 AND games_won <= games_played),
  CONSTRAINT unique_player_game_type UNIQUE (player_name, game_type)
);

-- =====================================================
-- 4. 触发器函数
-- =====================================================

-- 自动更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新游戏玩家数量函数
CREATE OR REPLACE FUNCTION update_game_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games 
        SET current_players = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = NEW.game_id AND is_spectator = FALSE
        ),
        spectators = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = NEW.game_id AND is_spectator = TRUE
        )
        WHERE id = NEW.game_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games 
        SET current_players = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = OLD.game_id AND is_spectator = FALSE
        ),
        spectators = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = OLD.game_id AND is_spectator = TRUE
        )
        WHERE id = OLD.game_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE games 
        SET current_players = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = NEW.game_id AND is_spectator = FALSE
        ),
        spectators = (
            SELECT COUNT(*) FROM players 
            WHERE game_id = NEW.game_id AND is_spectator = TRUE
        )
        WHERE id = NEW.game_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. 触发器设置
-- =====================================================

-- 自动更新时间戳触发器
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at 
    BEFORE UPDATE ON game_state 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_werewolf_games_updated_at
    BEFORE UPDATE ON werewolf_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
    BEFORE UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 玩家数量自动更新触发器
CREATE TRIGGER update_player_count_on_insert
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_game_player_count();

CREATE TRIGGER update_player_count_on_delete
    AFTER DELETE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_game_player_count();

CREATE TRIGGER update_player_count_on_update
    AFTER UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_game_player_count();

-- =====================================================
-- 6. 索引优化
-- =====================================================

-- 游戏表索引
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);

-- 玩家表索引
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_player_name ON players(player_name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_is_spectator ON players(is_spectator);

-- 游戏状态表索引
CREATE INDEX IF NOT EXISTS idx_game_state_game_id ON game_state(game_id);
CREATE INDEX IF NOT EXISTS idx_game_state_updated_at ON game_state(updated_at DESC);

-- 狼人杀游戏表索引
CREATE INDEX IF NOT EXISTS idx_werewolf_games_phase ON werewolf_games(phase);
CREATE INDEX IF NOT EXISTS idx_werewolf_games_created_at ON werewolf_games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_werewolf_games_created_by ON werewolf_games(created_by);

-- 游戏历史表索引
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON game_history(game_type);
CREATE INDEX IF NOT EXISTS idx_game_history_ended_at ON game_history(ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_winner ON game_history(winner);

-- 玩家统计表索引
CREATE INDEX IF NOT EXISTS idx_player_stats_player_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_game_type ON player_stats(game_type);
CREATE INDEX IF NOT EXISTS idx_player_stats_games_won ON player_stats(games_won DESC);

-- =====================================================
-- 7. 行级安全策略 (RLS)
-- =====================================================

-- 启用RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE werewolf_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 公开访问策略 (无认证系统)
-- 游戏表策略
CREATE POLICY "Allow public read access to games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert to games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to games" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to games" ON games FOR DELETE USING (true);

-- 玩家表策略
CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to players" ON players FOR DELETE USING (true);

-- 游戏状态表策略
CREATE POLICY "Allow public read access to game_state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_state" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to game_state" ON game_state FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to game_state" ON game_state FOR DELETE USING (true);

-- 狼人杀游戏表策略
CREATE POLICY "Allow public read access to werewolf_games" ON werewolf_games FOR SELECT USING (true);
CREATE POLICY "Allow public insert to werewolf_games" ON werewolf_games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to werewolf_games" ON werewolf_games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to werewolf_games" ON werewolf_games FOR DELETE USING (true);

-- 游戏历史表策略
CREATE POLICY "Allow public read access to game_history" ON game_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_history" ON game_history FOR INSERT WITH CHECK (true);

-- 玩家统计表策略
CREATE POLICY "Allow public read access to player_stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert to player_stats" ON player_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to player_stats" ON player_stats FOR UPDATE USING (true);

-- =====================================================
-- 8. 实时功能启用
-- =====================================================

-- 启用Supabase实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE werewolf_games;

-- =====================================================
-- 9. 有用的视图
-- =====================================================

-- 游戏详情视图 (包含玩家信息)
CREATE OR REPLACE VIEW game_details AS
SELECT 
    g.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', p.id,
                'player_name', p.player_name,
                'position', p.position,
                'is_spectator', p.is_spectator,
                'is_ready', p.is_ready,
                'score', p.score,
                'joined_at', p.joined_at
            ) ORDER BY p.position
        ) FILTER (WHERE p.id IS NOT NULL), 
        '[]'::json
    ) as players_info
FROM games g
LEFT JOIN players p ON g.id = p.game_id
GROUP BY g.id;

-- 玩家排行榜视图
CREATE OR REPLACE VIEW player_leaderboard AS
SELECT 
    player_name,
    game_type,
    games_played,
    games_won,
    CASE 
        WHEN games_played > 0 THEN ROUND((games_won::decimal / games_played * 100), 2)
        ELSE 0 
    END as win_rate,
    avg_score,
    last_played
FROM player_stats
WHERE games_played > 0
ORDER BY win_rate DESC, games_won DESC, avg_score DESC;

-- =====================================================
-- 10. 初始化数据 (可选)
-- =====================================================

-- 插入一些示例数据 (仅用于测试)
-- INSERT INTO games (name, created_by) VALUES ('测试房间', '系统');

-- =====================================================
-- 脚本执行完成
-- =====================================================

-- 显示创建的表
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('games', 'players', 'game_state', 'werewolf_games', 'game_history', 'player_stats')
ORDER BY tablename;

-- 显示创建的索引数量
SELECT 
    COUNT(*) as total_indexes,
    'Database setup completed successfully!' as status
FROM pg_indexes 
WHERE schemaname = 'public';