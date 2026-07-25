begin;

-- The public product is Sync Scratchpad. Rename the live database contract so
-- runtime code, PostgREST, realtime, and the schema snapshot all use the same
-- vocabulary. Historical messenger migrations remain unchanged as audit data.
alter table jg_app.messenger_messages rename to scratchpad_entries;
alter table jg_app.scratchpad_entries rename column message_type to entry_type;

alter table jg_app.scratchpad_entries
  rename constraint messenger_messages_type_check to scratchpad_entries_type_check;
alter table jg_app.scratchpad_entries
  rename constraint messenger_messages_pkey to scratchpad_entries_pkey;
alter table jg_app.scratchpad_entries
  rename constraint messenger_messages_user_id_fkey to scratchpad_entries_user_id_fkey;

alter index jg_app.idx_msg_messages_created_at
  rename to idx_scratchpad_entries_created_at;
alter index jg_app.idx_msg_messages_user_id
  rename to idx_scratchpad_entries_user_id;

alter trigger update_messenger_messages_updated_at
  on jg_app.scratchpad_entries
  rename to update_scratchpad_entries_updated_at;

alter policy "Users can delete own messages"
  on jg_app.scratchpad_entries
  rename to "Users can delete own scratchpad entries";
alter policy "Users can insert own messages"
  on jg_app.scratchpad_entries
  rename to "Users can insert own scratchpad entries";
alter policy "Users can update own messages"
  on jg_app.scratchpad_entries
  rename to "Users can update own scratchpad entries";
alter policy "Users can view own messages"
  on jg_app.scratchpad_entries
  rename to "Users can view own scratchpad entries";

commit;
