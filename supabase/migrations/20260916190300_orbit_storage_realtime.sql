begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'orbit-attachments',
  'orbit-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;

create policy "Orbit members read own attachment paths"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'orbit-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_product_access('orbit'))
  );

create policy "Orbit editors upload attachment paths"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'orbit-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_product_access('orbit'))
  );

alter publication supabase_realtime add table orbit.cards;
alter publication supabase_realtime add table orbit.comments;
alter publication supabase_realtime add table orbit.notifications;

commit;
