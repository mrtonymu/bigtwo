-- Add game options to games table for multi-player synchronization
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_options JSONB DEFAULT '{
  "allowSpectators": true,
  "gameSpeed": "normal",
  "autoPass": false,
  "showCardCount": true,
  "cardSorting": "auto",
  "autoArrange": true
}';

-- Add play_history to game_state table if not exists
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS play_history JSONB DEFAULT '[]';

-- Update existing games to have default game options
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