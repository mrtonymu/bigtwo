-- 修复表名，使用第一个脚本中实际创建的表名
-- 添加数据库索引和约束以提高性能
-- 为games表添加索引
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- 使用正确的表名 players 而不是 game_players
-- 为players表添加索引
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_player_name ON players(player_name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

-- 为game_state表添加索引
CREATE INDEX IF NOT EXISTS idx_game_state_game_id ON game_state(game_id);
CREATE INDEX IF NOT EXISTS idx_game_state_updated_at ON game_state(updated_at DESC);

-- 移除不存在的 game_moves 表的索引，因为我们使用 game_state 表来存储游戏状态

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
