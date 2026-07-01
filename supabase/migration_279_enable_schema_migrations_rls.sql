-- Supabase advisor 0013_rls_disabled_in_public:
-- public.schema_migrations is an internal migration tracking table used by scripts/apply-migrations.ts.
-- It should not be readable through PostgREST, so enable RLS without adding client policies.

alter table public.schema_migrations enable row level security;
