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
