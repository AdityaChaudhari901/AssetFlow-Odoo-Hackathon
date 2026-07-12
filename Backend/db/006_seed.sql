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
