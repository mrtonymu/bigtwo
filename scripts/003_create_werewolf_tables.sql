-- 创建狼人杀游戏表
CREATE TABLE IF NOT EXISTS werewolf_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  players JSONB NOT NULL DEFAULT '[]',
  phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
  day_count INTEGER NOT NULL DEFAULT 0,
  night_actions JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '[]',
  winner VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_werewolf_games_phase ON werewolf_games(phase);
CREATE INDEX IF NOT EXISTS idx_werewolf_games_created_at ON werewolf_games(created_at);

-- 启用行级安全
ALTER TABLE werewolf_games ENABLE ROW LEVEL SECURITY;

-- 创建策略：任何人都可以读取和创建
CREATE POLICY "Anyone can read werewolf games" ON werewolf_games
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create werewolf games" ON werewolf_games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update werewolf games" ON werewolf_games
  FOR UPDATE USING (true);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_werewolf_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_werewolf_games_updated_at
  BEFORE UPDATE ON werewolf_games
  FOR EACH ROW
  EXECUTE FUNCTION update_werewolf_games_updated_at();
