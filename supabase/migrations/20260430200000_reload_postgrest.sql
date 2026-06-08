NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
