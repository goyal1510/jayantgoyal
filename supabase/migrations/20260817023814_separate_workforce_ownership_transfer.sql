begin;

-- Full Admin access covers current product CRUD. Workforce ownership transfer
-- is a distinct, audited authority granted only through the owner role.
delete from iam.role_capabilities
where role_key in ('admin.full_access', 'operations.administrator')
  and capability_key = 'admin.access.transfer';

insert into iam.role_capabilities (role_key, capability_key)
values ('operations.owner', 'admin.access.transfer')
on conflict (role_key, capability_key) do nothing;

update iam.roles
set description = 'All current Admin operations except workforce ownership transfer.'
where key = 'admin.full_access';

commit;
