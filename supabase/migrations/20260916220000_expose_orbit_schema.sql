begin;

alter role authenticator set pgrst.db_schemas =
  'public,graphql_public,iam,studio,portfolio,career,orbit';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

commit;
