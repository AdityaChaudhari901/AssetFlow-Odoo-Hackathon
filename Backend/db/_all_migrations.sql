-- AssetFlow migration 000: extensions
create extension if not exists btree_gist;   -- booking overlap exclusion constraint
-- AssetFlow migration 001: tables
-- All timestamps are timestamptz (UTC). Statuses are text + CHECK for easy evolution.

-- ============ DEPARTMENTS ============
create table public.departments (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null unique,
  description           text,
  head_id               uuid,                             -- FK added after profiles exists
  parent_department_id  uuid references public.departments(id),
  status                text not null default 'active'
                        check (status in ('active','inactive')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============ PROFILES (employee directory; 1:1 with auth.users) ============
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  email          text not null unique,
  role           text not null default 'employee'
                 check (role in ('admin','asset_manager','department_head','employee')),
  department_id  uuid references public.departments(id),
  status         text not null default 'active' check (status in ('active','inactive')),
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.departments
  add constraint departments_head_fk foreign key (head_id) references public.profiles(id);

-- ============ ASSET CATEGORIES ============
create table public.asset_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  -- Definition of category-specific fields, e.g.
  -- [{"key":"warranty_months","label":"Warranty (months)","type":"number","required":false}]
  custom_fields jsonb not null default '[]',
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============ ASSETS ============
create sequence public.asset_tag_seq;

create table public.assets (
  id                  uuid primary key default gen_random_uuid(),
  asset_tag           text not null unique
                      default ('AF-' || lpad(nextval('public.asset_tag_seq')::text, 4, '0')),
  name                text not null,
  category_id         uuid not null references public.asset_categories(id),
  serial_number       text,
  acquisition_date    date,
  acquisition_cost    numeric(12,2),          -- reporting only, never accounting
  condition           text not null default 'good'
                      check (condition in ('new','good','fair','poor','damaged')),
  location            text,
  department_id       uuid references public.departments(id),
  status              text not null default 'available'
                      check (status in ('available','allocated','reserved',
                                        'under_maintenance','lost','retired','disposed')),
  is_bookable         boolean not null default false,
  image_url           text,
  custom_field_values jsonb not null default '{}',   -- {"warranty_months": 24}
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============ ALLOCATIONS ============
create table public.allocations (
  id                    uuid primary key default gen_random_uuid(),
  asset_id              uuid not null references public.assets(id),
  employee_id           uuid references public.profiles(id),
  department_id         uuid references public.departments(id),
  allocated_by          uuid not null references public.profiles(id),
  allocated_at          timestamptz not null default now(),
  expected_return_date  date,
  notes                 text,
  status                text not null default 'active' check (status in ('active','returned')),
  return_requested      boolean not null default false,
  returned_at           timestamptz,
  returned_to           uuid references public.profiles(id),
  return_condition      text check (return_condition in ('new','good','fair','poor','damaged')),
  return_notes          text,
  created_at            timestamptz not null default now(),
  constraint allocation_target check (employee_id is not null or department_id is not null)
);

-- ============ TRANSFER REQUESTS ============
create table public.transfer_requests (
  id                  uuid primary key default gen_random_uuid(),
  asset_id            uuid not null references public.assets(id),
  from_allocation_id  uuid not null references public.allocations(id),
  requested_by        uuid not null references public.profiles(id),
  to_employee_id      uuid references public.profiles(id),
  to_department_id    uuid references public.departments(id),
  reason              text,
  status              text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  reviewed_by         uuid references public.profiles(id),
  reviewed_at         timestamptz,
  review_notes        text,
  created_at          timestamptz not null default now(),
  constraint transfer_target check (to_employee_id is not null or to_department_id is not null)
);

-- ============ BOOKINGS ============
create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  asset_id       uuid not null references public.assets(id),
  booked_by      uuid not null references public.profiles(id),
  department_id  uuid references public.departments(id),   -- "on behalf of department"
  start_time     timestamptz not null,
  end_time       timestamptz not null,
  purpose        text,
  status         text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  cancelled_at   timestamptz,
  cancelled_by   uuid references public.profiles(id),
  cancel_reason  text,
  reminder_sent  boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint booking_time_valid check (end_time > start_time)
);

-- ============ MAINTENANCE REQUESTS ============
create table public.maintenance_requests (
  id               uuid primary key default gen_random_uuid(),
  asset_id         uuid not null references public.assets(id),
  raised_by        uuid not null references public.profiles(id),
  title            text not null,
  description      text,
  priority         text not null default 'medium'
                   check (priority in ('low','medium','high','critical')),
  photo_url        text,
  status           text not null default 'pending'
                   check (status in ('pending','approved','rejected',
                                     'assigned','in_progress','resolved')),
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  review_notes     text,
  technician_name  text,
  assigned_at      timestamptz,
  started_at       timestamptz,
  resolved_at      timestamptz,
  resolution_notes text,
  cost             numeric(12,2),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============ AUDIT CYCLES ============
create table public.audit_cycles (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  department_id  uuid references public.departments(id),   -- scope (nullable = org-wide)
  location       text,                                     -- scope (nullable)
  start_date     date not null,
  end_date       date not null,
  status         text not null default 'open' check (status in ('open','closed')),
  created_by     uuid not null references public.profiles(id),
  closed_by      uuid references public.profiles(id),
  closed_at      timestamptz,
  created_at     timestamptz not null default now()
);

create table public.audit_auditors (
  cycle_id    uuid not null references public.audit_cycles(id) on delete cascade,
  auditor_id  uuid not null references public.profiles(id),
  primary key (cycle_id, auditor_id)
);

create table public.audit_records (
  id          uuid primary key default gen_random_uuid(),
  cycle_id    uuid not null references public.audit_cycles(id) on delete cascade,
  asset_id    uuid not null references public.assets(id),
  result      text not null default 'pending'
              check (result in ('pending','verified','missing','damaged')),
  notes       text,
  audited_by  uuid references public.profiles(id),
  audited_at  timestamptz,
  unique (cycle_id, asset_id)
);

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null,
  title        text not null,
  message      text not null,
  entity_type  text,
  entity_id    uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============ ACTIVITY LOGS ============
create table public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id),
  action       text not null,          -- 'asset.created', 'transfer.approved', ...
  entity_type  text not null,
  entity_id    uuid,
  details      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
-- AssetFlow migration 002: race-proof invariants + query-path indexes

-- INVARIANT 1: an asset can have at most ONE active allocation
create unique index one_active_allocation_per_asset
  on public.allocations (asset_id) where (status = 'active');

-- INVARIANT 2: confirmed bookings for one asset can never overlap.
-- tstzrange default bounds are [start, end) — a booking ending 10:00 does NOT
-- conflict with one starting 10:00 (matches the problem statement example).
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (asset_id with =, tstzrange(start_time, end_time) with &&)
  where (status = 'confirmed');

-- Query-path indexes
create index idx_assets_status        on public.assets (status);
create index idx_assets_category      on public.assets (category_id);
create index idx_assets_department    on public.assets (department_id);
create index idx_alloc_asset          on public.allocations (asset_id);
create index idx_alloc_employee       on public.allocations (employee_id) where status = 'active';
create index idx_alloc_due            on public.allocations (expected_return_date) where status = 'active';
create index idx_bookings_asset_time  on public.bookings (asset_id, start_time);
create index idx_maint_asset          on public.maintenance_requests (asset_id);
create index idx_maint_status         on public.maintenance_requests (status);
create index idx_notif_user_unread    on public.notifications (user_id, is_read);
create index idx_logs_entity          on public.activity_logs (entity_type, entity_id);
-- AssetFlow migration 003: atomic multi-step operations as RPC functions.
-- PostgREST cannot run multi-statement transactions, so every operation that
-- touches two or more rows lives here. Python calls these via client.rpc().
-- Domain failures are raised with the error-code string in the message so the
-- backend can map them onto stable API error codes.

-- Allocate: validate availability, insert allocation, flip asset status.
create or replace function public.allocate_asset(
  p_asset_id uuid, p_employee_id uuid, p_department_id uuid,
  p_allocated_by uuid, p_expected_return_date date, p_notes text
) returns public.allocations language plpgsql as $$
declare
  v_status text;
  v_alloc public.allocations;
begin
  select status into v_status from public.assets where id = p_asset_id for update;
  if v_status is null then
    raise exception 'ASSET_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status <> 'available' then
    raise exception 'ASSET_NOT_AVAILABLE' using errcode = 'P0001';
  end if;
  insert into public.allocations
    (asset_id, employee_id, department_id, allocated_by, expected_return_date, notes)
  values (p_asset_id, p_employee_id, p_department_id, p_allocated_by, p_expected_return_date, p_notes)
  returning * into v_alloc;
  update public.assets set status = 'allocated', updated_at = now() where id = p_asset_id;
  return v_alloc;
end $$;

-- Return: close allocation, flip asset back to available, update condition.
create or replace function public.return_asset(
  p_allocation_id uuid, p_returned_to uuid, p_condition text, p_notes text
) returns public.allocations language plpgsql as $$
declare v_alloc public.allocations;
begin
  update public.allocations
     set status = 'returned', returned_at = now(), returned_to = p_returned_to,
         return_condition = p_condition, return_notes = p_notes
   where id = p_allocation_id and status = 'active'
  returning * into v_alloc;
  if v_alloc.id is null then
    raise exception 'ALREADY_PROCESSED' using errcode = 'P0001';
  end if;
  update public.assets
     set status = 'available', condition = coalesce(p_condition, condition), updated_at = now()
   where id = v_alloc.asset_id;
  return v_alloc;
end $$;

-- Approve transfer: close old allocation, create new one, mark request approved.
create or replace function public.approve_transfer(
  p_transfer_id uuid, p_reviewer uuid, p_review_notes text
) returns public.allocations language plpgsql as $$
declare
  v_req public.transfer_requests;
  v_new public.allocations;
begin
  select * into v_req from public.transfer_requests where id = p_transfer_id for update;
  if v_req.id is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_req.status <> 'pending' then raise exception 'ALREADY_PROCESSED' using errcode = 'P0001'; end if;

  update public.allocations
     set status = 'returned', returned_at = now(), returned_to = p_reviewer,
         return_notes = 'Transferred via request ' || p_transfer_id
   where id = v_req.from_allocation_id and status = 'active';

  insert into public.allocations (asset_id, employee_id, department_id, allocated_by)
  values (v_req.asset_id, v_req.to_employee_id, v_req.to_department_id, p_reviewer)
  returning * into v_new;

  update public.transfer_requests
     set status = 'approved', reviewed_by = p_reviewer, reviewed_at = now(),
         review_notes = p_review_notes
   where id = p_transfer_id;
  -- asset stays 'allocated'
  return v_new;
end $$;

-- Approve maintenance: flip request to approved and asset to under_maintenance.
create or replace function public.approve_maintenance(
  p_request_id uuid, p_reviewer uuid, p_notes text
) returns public.maintenance_requests language plpgsql as $$
declare v_req public.maintenance_requests;
begin
  select * into v_req from public.maintenance_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_req.status <> 'pending' then raise exception 'ALREADY_PROCESSED' using errcode = 'P0001'; end if;

  update public.maintenance_requests
     set status = 'approved', reviewed_by = p_reviewer, reviewed_at = now(),
         review_notes = p_notes, updated_at = now()
   where id = p_request_id
  returning * into v_req;

  update public.assets set status = 'under_maintenance', updated_at = now()
   where id = v_req.asset_id and status in ('available','allocated','reserved');
  return v_req;
end $$;

-- Resolve maintenance: request resolved; asset returns to 'allocated' when an
-- active allocation still exists, else 'available'.
create or replace function public.resolve_maintenance(
  p_request_id uuid, p_notes text, p_cost numeric
) returns public.maintenance_requests language plpgsql as $$
declare
  v_req public.maintenance_requests;
  v_has_allocation boolean;
begin
  select * into v_req from public.maintenance_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_req.status <> 'in_progress' then raise exception 'ALREADY_PROCESSED' using errcode = 'P0001'; end if;

  update public.maintenance_requests
     set status = 'resolved', resolved_at = now(), resolution_notes = p_notes,
         cost = p_cost, updated_at = now()
   where id = p_request_id
  returning * into v_req;

  select exists (
    select 1 from public.allocations where asset_id = v_req.asset_id and status = 'active'
  ) into v_has_allocation;

  update public.assets
     set status = case when v_has_allocation then 'allocated' else 'available' end,
         updated_at = now()
   where id = v_req.asset_id and status = 'under_maintenance';
  return v_req;
end $$;

-- Close audit cycle: lock cycle, missing assets -> 'lost'. Returns summary counts.
create or replace function public.close_audit_cycle(
  p_cycle_id uuid, p_actor uuid
) returns jsonb language plpgsql as $$
declare
  v_cycle public.audit_cycles;
  v_missing int; v_damaged int; v_verified int; v_pending int;
begin
  select * into v_cycle from public.audit_cycles where id = p_cycle_id for update;
  if v_cycle.id is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_cycle.status = 'closed' then raise exception 'AUDIT_CYCLE_CLOSED' using errcode = 'P0001'; end if;

  update public.assets a set status = 'lost', updated_at = now()
   from public.audit_records r
  where r.cycle_id = p_cycle_id and r.result = 'missing' and r.asset_id = a.id;

  update public.audit_cycles
     set status = 'closed', closed_by = p_actor, closed_at = now()
   where id = p_cycle_id;

  select count(*) filter (where result = 'missing'),
         count(*) filter (where result = 'damaged'),
         count(*) filter (where result = 'verified'),
         count(*) filter (where result = 'pending')
    into v_missing, v_damaged, v_verified, v_pending
    from public.audit_records where cycle_id = p_cycle_id;

  return jsonb_build_object('missing', v_missing, 'damaged', v_damaged,
                            'verified', v_verified, 'pending', v_pending);
end $$;
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
-- AssetFlow migration 005: row-level security
-- RLS is enabled everywhere with NO policies: the anon/publishable key can read
-- nothing. The backend's service-role key bypasses RLS; the API layer is the
-- only authorization surface.

alter table public.departments          enable row level security;
alter table public.profiles             enable row level security;
alter table public.asset_categories     enable row level security;
alter table public.assets               enable row level security;
alter table public.allocations          enable row level security;
alter table public.transfer_requests    enable row level security;
alter table public.bookings             enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.audit_cycles         enable row level security;
alter table public.audit_auditors       enable row level security;
alter table public.audit_records        enable row level security;
alter table public.notifications        enable row level security;
alter table public.activity_logs        enable row level security;
-- AssetFlow migration 006: master-data seed (idempotent).
-- Users, assets, allocations and bookings are seeded by scripts/seed.py because
-- they require auth.users rows created through the Supabase admin API.

insert into public.departments (name, description) values
  ('Engineering', 'Product and platform engineering'),
  ('Operations',  'Facilities and operations'),
  ('HR',          'People team')
on conflict (name) do nothing;

update public.departments
   set parent_department_id = (select id from public.departments where name = 'Operations')
 where name = 'HR' and parent_department_id is null;

insert into public.asset_categories (name, description, custom_fields) values
  ('Electronics',   'Laptops, monitors, phones',
   '[{"key":"warranty_months","label":"Warranty (months)","type":"number","required":false}]'),
  ('Furniture',     'Desks, chairs, storage', '[]'),
  ('Vehicles',      'Company vehicles',
   '[{"key":"registration_no","label":"Registration No.","type":"text","required":false}]'),
  ('Meeting Rooms', 'Bookable shared rooms', '[]')
on conflict (name) do nothing;
