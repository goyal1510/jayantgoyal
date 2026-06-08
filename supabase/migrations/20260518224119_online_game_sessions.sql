CREATE TYPE jg_app.game_hub_session_status AS ENUM (
  'waiting',
  'active',
  'completed',
  'abandoned'
);
CREATE TABLE jg_app.game_hub_sessions (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  room_code text NOT NULL,
  game_slug text NOT NULL,
  status jg_app.game_hub_session_status DEFAULT 'waiting' NOT NULL,
  max_players smallint DEFAULT 2 NOT NULL,
  created_by uuid NOT NULL,
  current_turn_participant_id uuid,
  winner_participant_id uuid,
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  state jsonb DEFAULT '{}'::jsonb NOT NULL,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT game_hub_sessions_game_slug_check CHECK (
    game_slug = ANY (
      ARRAY[
        'rock-paper-scissors',
        'tic-tac-toe',
        'dare-x',
        'connect-four',
        'memory-match',
        'wordle',
        'typing-speed'
      ]::text[]
    )
  ),
  CONSTRAINT game_hub_sessions_max_players_check CHECK (max_players BETWEEN 1 AND 8),
  CONSTRAINT game_hub_sessions_room_code_check CHECK (room_code ~ '^[A-Z0-9]{6,10}$')
);
CREATE TABLE jg_app.game_hub_session_participants (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  seat text NOT NULL,
  is_host boolean DEFAULT false NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
  left_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT game_hub_session_participants_display_name_check CHECK (
    char_length(display_name) BETWEEN 1 AND 80
  ),
  CONSTRAINT game_hub_session_participants_seat_check CHECK (
    seat ~ '^[A-Z0-9_-]{1,16}$'
  )
);
CREATE TABLE jg_app.game_hub_session_moves (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  session_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  move_number integer NOT NULL,
  move_payload jsonb NOT NULL,
  resulting_state jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT game_hub_session_moves_move_number_check CHECK (move_number > 0),
  CONSTRAINT game_hub_session_moves_move_payload_check CHECK (
    jsonb_typeof(move_payload) = 'object'
  )
);
CREATE TABLE jg_app.game_hub_session_results (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL,
  session_id uuid NOT NULL,
  winner_participant_id uuid,
  outcome text NOT NULL,
  summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT game_hub_session_results_outcome_check CHECK (
    outcome = ANY (ARRAY['win', 'draw', 'abandoned']::text[])
  )
);
ALTER TABLE ONLY jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_room_code_key UNIQUE (room_code);
ALTER TABLE ONLY jg_app.game_hub_session_participants
  ADD CONSTRAINT game_hub_session_participants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.game_hub_session_participants
  ADD CONSTRAINT game_hub_session_participants_session_user_key UNIQUE (session_id, user_id);
ALTER TABLE ONLY jg_app.game_hub_session_moves
  ADD CONSTRAINT game_hub_session_moves_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.game_hub_session_moves
  ADD CONSTRAINT game_hub_session_moves_session_move_key UNIQUE (session_id, move_number);
ALTER TABLE ONLY jg_app.game_hub_session_results
  ADD CONSTRAINT game_hub_session_results_pkey PRIMARY KEY (id);
ALTER TABLE ONLY jg_app.game_hub_session_results
  ADD CONSTRAINT game_hub_session_results_session_key UNIQUE (session_id);
CREATE UNIQUE INDEX game_hub_session_participants_active_seat_key
  ON jg_app.game_hub_session_participants (session_id, seat)
  WHERE left_at IS NULL;
CREATE INDEX idx_game_hub_sessions_created_by
  ON jg_app.game_hub_sessions (created_by);
CREATE INDEX idx_game_hub_sessions_room_code
  ON jg_app.game_hub_sessions (room_code);
CREATE INDEX idx_game_hub_sessions_status_expires
  ON jg_app.game_hub_sessions (status, expires_at);
CREATE INDEX idx_game_hub_session_participants_session
  ON jg_app.game_hub_session_participants (session_id);
CREATE INDEX idx_game_hub_session_participants_user
  ON jg_app.game_hub_session_participants (user_id);
CREATE INDEX idx_game_hub_session_moves_session_number
  ON jg_app.game_hub_session_moves (session_id, move_number);
ALTER TABLE ONLY jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_participants
  ADD CONSTRAINT game_hub_session_participants_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES jg_app.game_hub_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_participants
  ADD CONSTRAINT game_hub_session_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_moves
  ADD CONSTRAINT game_hub_session_moves_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES jg_app.game_hub_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_moves
  ADD CONSTRAINT game_hub_session_moves_participant_id_fkey
  FOREIGN KEY (participant_id) REFERENCES jg_app.game_hub_session_participants(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_results
  ADD CONSTRAINT game_hub_session_results_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES jg_app.game_hub_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY jg_app.game_hub_session_results
  ADD CONSTRAINT game_hub_session_results_winner_participant_id_fkey
  FOREIGN KEY (winner_participant_id) REFERENCES jg_app.game_hub_session_participants(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_current_turn_participant_id_fkey
  FOREIGN KEY (current_turn_participant_id) REFERENCES jg_app.game_hub_session_participants(id) ON DELETE SET NULL;
ALTER TABLE ONLY jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_winner_participant_id_fkey
  FOREIGN KEY (winner_participant_id) REFERENCES jg_app.game_hub_session_participants(id) ON DELETE SET NULL;
CREATE TRIGGER update_game_hub_sessions_updated_at
  BEFORE UPDATE ON jg_app.game_hub_sessions
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
CREATE TRIGGER update_game_hub_session_participants_updated_at
  BEFORE UPDATE ON jg_app.game_hub_session_participants
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
ALTER TABLE jg_app.game_hub_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.game_hub_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.game_hub_session_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.game_hub_session_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create owned game sessions"
  ON jg_app.game_hub_sessions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can view joinable or joined game sessions"
  ON jg_app.game_hub_sessions
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR status = 'waiting'
    OR EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_sessions.id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
CREATE POLICY "Session participants can update game sessions"
  ON jg_app.game_hub_sessions
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_sessions.id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_sessions.id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
CREATE POLICY "Users can view own game participants"
  ON jg_app.game_hub_session_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can join game sessions as themselves"
  ON jg_app.game_hub_session_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM jg_app.game_hub_sessions s
      WHERE s.id = game_hub_session_participants.session_id
        AND s.status IN ('waiting', 'active')
        AND s.expires_at > now()
    )
  );
CREATE POLICY "Users can update own game participant row"
  ON jg_app.game_hub_session_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Participants can view game moves"
  ON jg_app.game_hub_session_moves
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_session_moves.session_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
CREATE POLICY "Participants can insert own game moves"
  ON jg_app.game_hub_session_moves
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.id = game_hub_session_moves.participant_id
        AND p.session_id = game_hub_session_moves.session_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
CREATE POLICY "Participants can view game results"
  ON jg_app.game_hub_session_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_session_results.session_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
CREATE POLICY "Participants can insert game results"
  ON jg_app.game_hub_session_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM jg_app.game_hub_session_participants p
      WHERE p.session_id = game_hub_session_results.session_id
        AND p.user_id = auth.uid()
        AND p.left_at IS NULL
    )
  );
GRANT ALL ON TABLE jg_app.game_hub_sessions TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.game_hub_session_participants TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.game_hub_session_moves TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.game_hub_session_results TO authenticated, service_role;
GRANT USAGE ON TYPE jg_app.game_hub_session_status TO authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.game_hub_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.game_hub_session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.game_hub_session_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE jg_app.game_hub_session_results;
