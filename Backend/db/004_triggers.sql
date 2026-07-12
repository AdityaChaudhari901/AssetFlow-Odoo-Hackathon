-- AssetFlow migration 004: triggers

-- Auto-create a profile (role 'employee') whenever an auth user is created.
-- Roles are NEVER chosen at signup; only an admin promotes via the directory.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at touch
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger touch_departments before update on public.departments
  for each row execute function public.touch_updated_at();
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_categories before update on public.asset_categories
  for each row execute function public.touch_updated_at();
create trigger touch_assets before update on public.assets
  for each row execute function public.touch_updated_at();
create trigger touch_maintenance before update on public.maintenance_requests
  for each row execute function public.touch_updated_at();
