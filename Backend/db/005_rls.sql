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
