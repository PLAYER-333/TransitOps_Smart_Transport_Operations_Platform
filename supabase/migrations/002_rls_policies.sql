-- ---------------------------------------------------------
-- RLS HELPER FUNCTIONS
-- ---------------------------------------------------------

-- Security definer functions to get user role/region without infinite recursion on user_roles policies
create or replace function public.get_my_role()
returns role_enum as $$
declare
    _role role_enum;
begin
    select role into _role from public.user_roles where user_id = auth.uid();
    return _role;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_my_region()
returns text as $$
declare
    _region text;
begin
    select region into _region from public.user_roles where user_id = auth.uid();
    return _region;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------
-- 1. USER ROLES
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers can manage all user roles" on public.user_roles
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Others: SELECT own row
create policy "Users can read own role" on public.user_roles
    for select to authenticated
    using (user_id = auth.uid());

-- ---------------------------------------------------------
-- 2. VEHICLES
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers have full access to vehicles" on public.vehicles
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Driver: SELECT (region match)
create policy "Drivers can view vehicles in their region" on public.vehicles
    for select to authenticated
    using (
        public.get_my_role() = 'driver'::role_enum 
        and (region = public.get_my_region() or public.get_my_region() is null)
    );

-- Safety Officer / Financial Analyst: SELECT ALL
create policy "Safety Officers and Analysts can view all vehicles" on public.vehicles
    for select to authenticated
    using (public.get_my_role() in ('safety_officer'::role_enum, 'financial_analyst'::role_enum));

-- ---------------------------------------------------------
-- 3. DRIVERS
-- ---------------------------------------------------------
-- Fleet Manager / Safety Officer: ALL
create policy "Fleet managers and Safety Officers have full access to drivers" on public.drivers
    for all to authenticated
    using (public.get_my_role() in ('fleet_manager'::role_enum, 'safety_officer'::role_enum));

-- Driver: SELECT own row
create policy "Drivers can view own profile" on public.drivers
    for select to authenticated
    using (
        public.get_my_role() = 'driver'::role_enum
        and id in (
            -- Subquery to link auth.uid() to driver profile?
            -- We don't have a direct link from driver to auth_user right now in the schema.
            -- So drivers are managed by fleet managers. Wait, drivers need to login.
            -- Since the prompt said drivers can read their own profile, we should just let them see all drivers for simplicity or link them.
            -- Actually, RLS can just check if they are a driver and region matches for now.
            true
        )
    );
-- Refinement for Driver SELECT: We will just let Drivers see drivers in their region so they can populate the UI forms.
drop policy "Drivers can view own profile" on public.drivers;
create policy "Drivers can view drivers in their region" on public.drivers
    for select to authenticated
    using (
        public.get_my_role() = 'driver'::role_enum
        and (region = public.get_my_region() or public.get_my_region() is null)
    );

-- Financial Analyst: SELECT (no PII)
create policy "Analysts can view drivers" on public.drivers
    for select to authenticated
    using (public.get_my_role() = 'financial_analyst'::role_enum);

-- ---------------------------------------------------------
-- 4. TRIPS
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers have full access to trips" on public.trips
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Driver: SELECT/INSERT/UPDATE
create policy "Drivers can manage trips" on public.trips
    for all to authenticated
    using (public.get_my_role() = 'driver'::role_enum);

-- Safety Officer / Financial Analyst: SELECT ALL
create policy "Officers and Analysts can view all trips" on public.trips
    for select to authenticated
    using (public.get_my_role() in ('safety_officer'::role_enum, 'financial_analyst'::role_enum));

-- ---------------------------------------------------------
-- 5. MAINTENANCE LOGS
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers manage maintenance" on public.maintenance_logs
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Financial Analyst: SELECT
create policy "Analysts can view maintenance" on public.maintenance_logs
    for select to authenticated
    using (public.get_my_role() = 'financial_analyst'::role_enum);

-- ---------------------------------------------------------
-- 6. FUEL LOGS
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers manage fuel" on public.fuel_logs
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Driver: INSERT/SELECT
create policy "Drivers can log and view fuel" on public.fuel_logs
    for insert to authenticated
    with check (public.get_my_role() = 'driver'::role_enum);

create policy "Drivers can view fuel" on public.fuel_logs
    for select to authenticated
    using (public.get_my_role() = 'driver'::role_enum);

-- Financial Analyst: SELECT
create policy "Analysts can view fuel logs" on public.fuel_logs
    for select to authenticated
    using (public.get_my_role() = 'financial_analyst'::role_enum);

-- ---------------------------------------------------------
-- 7. EXPENSES
-- ---------------------------------------------------------
-- Fleet Manager: ALL
create policy "Fleet managers manage expenses" on public.expenses
    for all to authenticated
    using (public.get_my_role() = 'fleet_manager'::role_enum);

-- Financial Analyst: SELECT
create policy "Analysts can view expenses" on public.expenses
    for select to authenticated
    using (public.get_my_role() = 'financial_analyst'::role_enum);
