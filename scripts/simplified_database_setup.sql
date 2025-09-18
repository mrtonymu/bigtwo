-- =====================================================
-- 精简版大二游戏数据库设置脚本
-- 只包含实际使用的表结构和必要的索引
-- =====================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 核心游戏表结构 (仅大二游戏)
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
  game_options JSONB DEFAULT '{
    "autoArrange": true,
    "cardSorting": "suit",
    "showHints": true,
    "autoPass": false,
    "autoPlay": false
  }',
  
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
  score INTEGER DEFAULT 0,
  is_spectator BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 游戏状态表
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_player INTEGER NOT NULL DEFAULT 0,
  last_play JSONB DEFAULT '[]', -- 上一次出牌
  last_player INTEGER, -- 上一次出牌的玩家
  deck JSONB DEFAULT '[]', -- 剩余牌堆
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  play_history JSONB DEFAULT '[]'
);

-- =====================================================
-- 2. 触发器函数
-- =====================================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 自动更新游戏玩家数量的触发器函数
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
-- 3. 触发器
-- =====================================================

-- 自动更新 updated_at 字段
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at 
    BEFORE UPDATE ON game_state 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动更新游戏玩家数量
CREATE TRIGGER update_game_player_count_insert
    AFTER INSERT ON players
    FOR EACH ROW EXECUTE FUNCTION update_game_player_count();

CREATE TRIGGER update_game_player_count_delete
    AFTER DELETE ON players
    FOR EACH ROW EXECUTE FUNCTION update_game_player_count();

CREATE TRIGGER update_game_player_count_update
    AFTER UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_game_player_count();

-- =====================================================
-- 4. 索引优化
-- =====================================================

-- 游戏表索引
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- 玩家表索引
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_player_name ON players(player_name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

-- 游戏状态表索引
CREATE INDEX IF NOT EXISTS idx_game_state_game_id ON game_state(game_id);
CREATE INDEX IF NOT EXISTS idx_game_state_updated_at ON game_state(updated_at DESC);

-- =====================================================
-- 5. 行级安全策略 (RLS)
-- =====================================================

-- 启用RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- 游戏表策略 (允许公共访问)
CREATE POLICY "Allow public read access to games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert to games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to games" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to games" ON games FOR DELETE USING (true);

-- 玩家表策略 (允许公共访问)
CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to players" ON players FOR DELETE USING (true);

-- 游戏状态表策略 (允许公共访问)
CREATE POLICY "Allow public read access to game_state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_state" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to game_state" ON game_state FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to game_state" ON game_state FOR DELETE USING (true);

-- =====================================================
-- 6. 实时功能启用
-- =====================================================

-- 启用Supabase实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- =====================================================
-- 7. 有用的视图
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
                'score', p.score,
                'joined_at', p.joined_at
            ) ORDER BY p.position
        ) FILTER (WHERE p.id IS NOT NULL), 
        '[]'::json
    ) as players_info
FROM games g
LEFT JOIN players p ON g.id = p.game_id
GROUP BY g.id;

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
    AND tablename IN ('games', 'players', 'game_state')
ORDER BY tablename;

-- 显示创建的索引数量
SELECT 
    COUNT(*) as total_indexes,
    'Simplified database setup completed successfully!' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('games', 'players', 'game_state');