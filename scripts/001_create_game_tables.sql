-- Create games table to store game rooms
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_progress, finished
  max_players INTEGER NOT NULL DEFAULT 4,
  current_players INTEGER NOT NULL DEFAULT 0,
  spectators INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table to store players in games
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  position INTEGER NOT NULL, -- 0, 1, 2, 3 for 4 players
  cards JSONB DEFAULT '[]', -- player's cards
  is_spectator BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_state table to store current game state
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_player INTEGER NOT NULL DEFAULT 0,
  last_play JSONB DEFAULT '[]', -- last cards played
  last_player INTEGER,
  deck JSONB DEFAULT '[]', -- remaining deck
  turn_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth required)
CREATE POLICY "Allow public read access to games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert to games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to games" ON games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to players" ON players FOR DELETE USING (true);

CREATE POLICY "Allow public read access to game_state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert to game_state" ON game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to game_state" ON game_state FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_state_game_id ON game_state(game_id);
