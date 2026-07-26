-- Evaluate the authenticated user once per statement instead of once per row.
-- These ALTER POLICY statements preserve the existing authorization predicates.

alter policy "Super admins can delete profiles" on jg_account.profiles
  using (exists (
    select 1
    from jg_account.profiles profiles_1
    where profiles_1.user_id = (select auth.uid())
      and profiles_1.role = 'super_admin'::jg_account.user_role
  ));

alter policy "Super admins can insert profiles" on jg_account.profiles
  with check (exists (
    select 1
    from jg_account.profiles profiles_1
    where profiles_1.user_id = (select auth.uid())
      and profiles_1.role = 'super_admin'::jg_account.user_role
  ));

alter policy "Super admins can update any profile" on jg_account.profiles
  using (exists (
    select 1
    from jg_account.profiles profiles_1
    where profiles_1.user_id = (select auth.uid())
      and profiles_1.role = 'super_admin'::jg_account.user_role
  ));

alter policy "Users can read own profile" on jg_account.profiles
  using ((select auth.uid()) = user_id);

alter policy "Users can update own profile" on jg_account.profiles
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and role = (
      select profiles_1.role
      from jg_account.profiles profiles_1
      where profiles_1.user_id = (select auth.uid())
    )
  );

alter policy "Users can delete own activities" on jg_app.activity_tracker_activities
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own activities" on jg_app.activity_tracker_activities
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own activities" on jg_app.activity_tracker_activities
  using ((select auth.uid()) = user_id);

alter policy "Users can view own activities" on jg_app.activity_tracker_activities
  using ((select auth.uid()) = user_id);

alter policy "Users can delete own entries" on jg_app.activity_tracker_entries
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own entries" on jg_app.activity_tracker_entries
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own entries" on jg_app.activity_tracker_entries
  using ((select auth.uid()) = user_id);

alter policy "Users can view own entries" on jg_app.activity_tracker_entries
  using ((select auth.uid()) = user_id);

alter policy delete_own_calculations on jg_app.currency_calculator_calculations
  using (user_id = (select auth.uid()));

alter policy insert_own_calculations on jg_app.currency_calculator_calculations
  with check (user_id = (select auth.uid()));

alter policy select_own_calculations on jg_app.currency_calculator_calculations
  using (user_id = (select auth.uid()));

alter policy update_own_calculations on jg_app.currency_calculator_calculations
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy delete_own_denominations on jg_app.currency_calculator_denominations
  using (
    calculation_id in (
      select calculations.id
      from jg_app.currency_calculator_calculations calculations
      where calculations.user_id = (select auth.uid())
    )
  );

alter policy insert_own_denominations on jg_app.currency_calculator_denominations
  with check (
    calculation_id in (
      select calculations.id
      from jg_app.currency_calculator_calculations calculations
      where calculations.user_id = (select auth.uid())
    )
  );

alter policy select_own_denominations on jg_app.currency_calculator_denominations
  using (
    calculation_id in (
      select calculations.id
      from jg_app.currency_calculator_calculations calculations
      where calculations.user_id = (select auth.uid())
    )
  );

alter policy update_own_denominations on jg_app.currency_calculator_denominations
  using (
    calculation_id in (
      select calculations.id
      from jg_app.currency_calculator_calculations calculations
      where calculations.user_id = (select auth.uid())
    )
  )
  with check (
    calculation_id in (
      select calculations.id
      from jg_app.currency_calculator_calculations calculations
      where calculations.user_id = (select auth.uid())
    )
  );

alter policy "Users can delete own files" on jg_app.file_manager_files
  using (user_id = (select auth.uid()));

alter policy "Users can insert own files" on jg_app.file_manager_files
  with check (user_id = (select auth.uid()));

alter policy "Users can update own files" on jg_app.file_manager_files
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "Users can view own files" on jg_app.file_manager_files
  using (user_id = (select auth.uid()) and not is_deleted);

alter policy "Participants can insert own game moves" on jg_app.game_hub_session_moves
  with check (exists (
    select 1
    from jg_app.game_hub_session_participants participant
    where participant.id = game_hub_session_moves.participant_id
      and participant.session_id = game_hub_session_moves.session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  ));

alter policy "Participants can view game moves" on jg_app.game_hub_session_moves
  using (exists (
    select 1
    from jg_app.game_hub_session_participants participant
    where participant.session_id = game_hub_session_moves.session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  ));

alter policy "Users can join game sessions as themselves" on jg_app.game_hub_session_participants
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from jg_app.game_hub_sessions session
      where session.id = game_hub_session_participants.session_id
        and session.status = any (
          array[
            'waiting'::jg_app.game_hub_session_status,
            'active'::jg_app.game_hub_session_status
          ]
        )
        and session.expires_at > now()
    )
  );

alter policy "Users can update own game participant row" on jg_app.game_hub_session_participants
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "Users can view own game participants" on jg_app.game_hub_session_participants
  using (user_id = (select auth.uid()));

alter policy "Participants can insert game results" on jg_app.game_hub_session_results
  with check (exists (
    select 1
    from jg_app.game_hub_session_participants participant
    where participant.session_id = game_hub_session_results.session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  ));

alter policy "Participants can view game results" on jg_app.game_hub_session_results
  using (exists (
    select 1
    from jg_app.game_hub_session_participants participant
    where participant.session_id = game_hub_session_results.session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  ));

alter policy "Session participants can update game sessions" on jg_app.game_hub_sessions
  using (
    created_by = (select auth.uid())
    or exists (
      select 1
      from jg_app.game_hub_session_participants participant
      where participant.session_id = game_hub_sessions.id
        and participant.user_id = (select auth.uid())
        and participant.left_at is null
    )
  )
  with check (
    created_by = (select auth.uid())
    or exists (
      select 1
      from jg_app.game_hub_session_participants participant
      where participant.session_id = game_hub_sessions.id
        and participant.user_id = (select auth.uid())
        and participant.left_at is null
    )
  );

alter policy "Users can create owned game sessions" on jg_app.game_hub_sessions
  with check (created_by = (select auth.uid()));

alter policy "Users can view joinable or joined game sessions" on jg_app.game_hub_sessions
  using (
    created_by = (select auth.uid())
    or status = 'waiting'::jg_app.game_hub_session_status
    or exists (
      select 1
      from jg_app.game_hub_session_participants participant
      where participant.session_id = game_hub_sessions.id
        and participant.user_id = (select auth.uid())
        and participant.left_at is null
    )
  );

alter policy "Users can insert own results" on jg_app.game_hub_typing_speed_results
  with check ((select auth.uid()) = user_id);

alter policy "Users can view own results" on jg_app.game_hub_typing_speed_results
  using ((select auth.uid()) = user_id);

alter policy "Users can delete own scratchpad entries" on jg_app.scratchpad_entries
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own scratchpad entries" on jg_app.scratchpad_entries
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own scratchpad entries" on jg_app.scratchpad_entries
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can view own scratchpad entries" on jg_app.scratchpad_entries
  using ((select auth.uid()) = user_id);

alter policy "Users can delete own tool favorites" on jg_app.tool_favorites
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own tool favorites" on jg_app.tool_favorites
  with check ((select auth.uid()) = user_id);

alter policy "Users can view own tool favorites" on jg_app.tool_favorites
  using ((select auth.uid()) = user_id);

alter policy "Users can delete own tool history" on jg_app.tool_history
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own tool history" on jg_app.tool_history
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own tool history" on jg_app.tool_history
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can view own tool history" on jg_app.tool_history
  using ((select auth.uid()) = user_id);

-- Support the authenticated filters and ordering used by the busiest product
-- feeds without adding indexes for columns that are not queried.
create index if not exists idx_scratchpad_entries_user_created
  on jg_app.scratchpad_entries (user_id, created_at desc);

create index if not exists idx_currency_calculations_user_created
  on jg_app.currency_calculator_calculations (user_id, created_at desc);

create index if not exists idx_currency_denominations_calculation
  on jg_app.currency_calculator_denominations (calculation_id);
