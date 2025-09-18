-- ==========================================
-- Big Two Game - 数据库结构更新脚本
-- 用于更新现有数据库以匹配最新代码结构
-- ==========================================

-- 1. 确保games表包含game_options字段
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS game_options JSONB DEFAULT '{
  "allowSpectators": true,
  "gameSpeed": "normal",
  "autoPass": false,
  "showCardCount": true,
  "cardSorting": "auto",
  "autoArrange": true
}';

-- 2. 确保game_state表包含play_history字段
ALTER TABLE game_state 
ADD COLUMN IF NOT EXISTS play_history JSONB DEFAULT '[]';

-- 3. 确保game_state表包含game_rules字段
ALTER TABLE game_state 
ADD COLUMN IF NOT EXISTS game_rules JSONB DEFAULT '{}';

-- 4. 删除可能存在的旧状态约束
ALTER TABLE games DROP CONSTRAINT IF EXISTS check_status;

-- 5. 添加正确的状态值约束
ALTER TABLE games ADD CONSTRAINT check_status 
CHECK (status IN ('waiting', 'in_progress', 'finished'));

-- 6. 更新现有数据中可能存在的错误状态值
UPDATE games 
SET status = 'in_progress' 
WHERE status = 'in-progress';

-- 7. 为现有记录设置默认值
UPDATE games 
SET game_options = '{
  "allowSpectators": true,
  "gameSpeed": "normal",
  "autoPass": false,
  "showCardCount": true,
  "cardSorting": "auto",
  "autoArrange": true
}'
WHERE game_options IS NULL;

UPDATE game_state 
SET play_history = '[]'
WHERE play_history IS NULL;

UPDATE game_state 
SET game_rules = '{}'
WHERE game_rules IS NULL;

-- 8. 验证更新结果
-- 检查games表字段
SELECT 'games表字段验证' as check_name, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'games' 
AND column_name IN ('game_options');

-- 检查game_state表字段
SELECT 'game_state表字段验证' as check_name, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'game_state' 
AND column_name IN ('play_history', 'game_rules');

-- 检查状态值分布
SELECT '状态值分布' as check_name, 
       status, 
       COUNT(*) as count 
FROM games 
GROUP BY status 
ORDER BY status;

-- 检查约束是否存在
SELECT '约束验证' as check_name,
       conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'games'::regclass 
AND contype = 'c' 
AND conname = 'check_status';

-- ==========================================
-- 数据库结构更新完成
-- ==========================================