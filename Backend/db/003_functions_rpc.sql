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
