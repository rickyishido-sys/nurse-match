alter table public.users
add column if not exists is_test_user boolean not null default false;
