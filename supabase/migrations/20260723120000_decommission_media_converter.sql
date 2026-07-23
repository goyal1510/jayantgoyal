begin;

drop policy if exists "Users can read own media conversion output"
  on storage.objects;

drop function if exists jg_app.claim_media_conversion_job();
drop function if exists jg_app.requeue_stale_media_conversion_jobs();
drop function if exists jg_app.claim_expired_media_conversion_job();

drop table if exists jg_app.media_conversion_jobs;

commit;
