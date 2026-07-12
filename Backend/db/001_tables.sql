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
