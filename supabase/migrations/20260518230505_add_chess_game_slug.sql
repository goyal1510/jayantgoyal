ALTER TABLE jg_app.game_hub_sessions
  DROP CONSTRAINT game_hub_sessions_game_slug_check;
ALTER TABLE jg_app.game_hub_sessions
  ADD CONSTRAINT game_hub_sessions_game_slug_check CHECK (
    game_slug = ANY (
      ARRAY[
        'rock-paper-scissors',
        'tic-tac-toe',
        'dare-x',
        'connect-four',
        'memory-match',
        'wordle',
        'typing-speed',
        'chess'
      ]::text[]
    )
  );
