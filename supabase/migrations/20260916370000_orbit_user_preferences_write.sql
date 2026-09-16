begin;

grant insert, update on table orbit.user_preferences to authenticated;

commit;
