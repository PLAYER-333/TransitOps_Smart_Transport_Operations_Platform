-- =========================================================
-- PART 1: SCHEMA (TABLES & ENUMS)
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUMS
create type role_enum as enum ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
create type vehicle_status_enum as enum ('Available', 'On Trip', 'In Shop', 'Retired');
create type driver_status_enum as enum ('Available', 'On Trip', 'Off Duty', 'Suspended');
create type trip_status_enum as enum ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- 1. User Roles
create table public.user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null unique,
    role role_enum not null,
    region text,
    created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

-- 2. Vehicles
create table public.vehicles (
    id uuid primary key default uuid_generate_v4(),
    registration_number text unique not null,
    name_model text not null,
    type text not null,
    max_load_capacity numeric not null check (max_load_capacity >= 0),
    odometer numeric not null default 0 check (odometer >= 0),
    acquisition_cost numeric not null default 0 check (acquisition_cost >= 0),
    region text,
    status vehicle_status_enum not null default 'Available',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;

-- 3. Drivers
create table public.drivers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    license_number text unique not null,
    license_category text not null,
    license_expiry date not null,
    contact_number text,
    safety_score numeric not null default 100 check (safety_score >= 0 and safety_score <= 100),
    region text,
    status driver_status_enum not null default 'Available',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.drivers enable row level security;

-- 4. Trips
create table public.trips (
    id uuid primary key default uuid_generate_v4(),
    source text not null,
    destination text not null,
    vehicle_id uuid references public.vehicles not null,
    driver_id uuid references public.drivers not null,
    cargo_weight numeric not null check (cargo_weight >= 0),
    planned_distance numeric not null check (planned_distance >= 0),
    final_odometer numeric check (final_odometer >= 0),
    fuel_consumed numeric check (fuel_consumed >= 0),
    revenue numeric check (revenue >= 0),
    status trip_status_enum not null default 'Draft',
    created_by uuid references auth.users not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.trips enable row level security;

-- 5. Maintenance Logs
create table public.maintenance_logs (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid references public.vehicles not null,
    description text not null,
    cost numeric not null check (cost >= 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    closed_at timestamptz
);
alter table public.maintenance_logs enable row level security;

-- 6. Fuel Logs
create table public.fuel_logs (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid references public.vehicles not null,
    trip_id uuid references public.trips,
    liters numeric not null check (liters >= 0),
    cost numeric not null check (cost >= 0),
    log_date date not null,
    created_at timestamptz not null default now()
);
alter table public.fuel_logs enable row level security;

-- 7. Expenses
create table public.expenses (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid references public.vehicles not null,
    category text not null,
    amount numeric not null check (amount >= 0),
    expense_date date not null,
    note text,
    created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;

-- Updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.handle_updated_at();
create trigger drivers_updated_at before update on public.drivers for each row execute function public.handle_updated_at();
create trigger trips_updated_at before update on public.trips for each row execute function public.handle_updated_at();


-- =========================================================
-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Helper functions
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

-- User Roles Policies
create policy "Fleet managers can manage all user roles" on public.user_roles for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Users can read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- Vehicles Policies
create policy "Fleet managers have full access to vehicles" on public.vehicles for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Drivers can view vehicles in their region" on public.vehicles for select to authenticated using (public.get_my_role() = 'driver'::role_enum and (region = public.get_my_region() or public.get_my_region() is null));
create policy "Safety Officers and Analysts can view all vehicles" on public.vehicles for select to authenticated using (public.get_my_role() in ('safety_officer'::role_enum, 'financial_analyst'::role_enum));

-- Drivers Policies
create policy "Fleet managers and Safety Officers have full access to drivers" on public.drivers for all to authenticated using (public.get_my_role() in ('fleet_manager'::role_enum, 'safety_officer'::role_enum));
create policy "Drivers can view drivers in their region" on public.drivers for select to authenticated using (public.get_my_role() = 'driver'::role_enum and (region = public.get_my_region() or public.get_my_region() is null));
create policy "Analysts can view drivers" on public.drivers for select to authenticated using (public.get_my_role() = 'financial_analyst'::role_enum);

-- Trips Policies
create policy "Fleet managers have full access to trips" on public.trips for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Drivers can manage trips" on public.trips for all to authenticated using (public.get_my_role() = 'driver'::role_enum);
create policy "Officers and Analysts can view all trips" on public.trips for select to authenticated using (public.get_my_role() in ('safety_officer'::role_enum, 'financial_analyst'::role_enum));

-- Maintenance Policies
create policy "Fleet managers manage maintenance" on public.maintenance_logs for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Analysts can view maintenance" on public.maintenance_logs for select to authenticated using (public.get_my_role() = 'financial_analyst'::role_enum);

-- Fuel Logs Policies
create policy "Fleet managers manage fuel" on public.fuel_logs for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Drivers can log and view fuel" on public.fuel_logs for insert to authenticated with check (public.get_my_role() = 'driver'::role_enum);
create policy "Drivers can view fuel" on public.fuel_logs for select to authenticated using (public.get_my_role() = 'driver'::role_enum);
create policy "Analysts can view fuel logs" on public.fuel_logs for select to authenticated using (public.get_my_role() = 'financial_analyst'::role_enum);

-- Expenses Policies
create policy "Fleet managers manage expenses" on public.expenses for all to authenticated using (public.get_my_role() = 'fleet_manager'::role_enum);
create policy "Analysts can view expenses" on public.expenses for select to authenticated using (public.get_my_role() = 'financial_analyst'::role_enum);


-- =========================================================
-- PART 3: TRIGGERS (Automated Status Updates)
-- =========================================================

-- Trip Dispatched
create or replace function public.on_trip_dispatched() returns trigger as $$
begin
    if NEW.status = 'Dispatched' and OLD.status = 'Draft' then
        update public.vehicles set status = 'On Trip' where id = NEW.vehicle_id and status = 'Available';
        if not found then raise exception 'Vehicle is not available for dispatch.'; end if;
        update public.drivers set status = 'On Trip' where id = NEW.driver_id and status = 'Available';
        if not found then raise exception 'Driver is not available for dispatch.'; end if;
    end if;
    return NEW;
end;
$$ language plpgsql;
create trigger trip_dispatched_trigger after update on public.trips for each row execute function public.on_trip_dispatched();

-- Trip Completed
create or replace function public.on_trip_completed() returns trigger as $$
begin
    if NEW.status = 'Completed' and OLD.status = 'Dispatched' then
        update public.vehicles set status = 'Available' where id = NEW.vehicle_id;
        if NEW.final_odometer is not null then
            update public.vehicles set odometer = greatest(odometer, NEW.final_odometer) where id = NEW.vehicle_id;
        end if;
        update public.drivers set status = 'Available' where id = NEW.driver_id;
    end if;
    return NEW;
end;
$$ language plpgsql;
create trigger trip_completed_trigger after update on public.trips for each row execute function public.on_trip_completed();

-- Trip Cancelled
create or replace function public.on_trip_cancelled() returns trigger as $$
begin
    if NEW.status = 'Cancelled' and OLD.status = 'Dispatched' then
        update public.vehicles set status = 'Available' where id = NEW.vehicle_id;
        update public.drivers set status = 'Available' where id = NEW.driver_id;
    end if;
    return NEW;
end;
$$ language plpgsql;
create trigger trip_cancelled_trigger after update on public.trips for each row execute function public.on_trip_cancelled();

-- Maintenance Started/Closed
create or replace function public.on_maintenance_started() returns trigger as $$
begin
    if NEW.is_active = true then
        update public.vehicles set status = 'In Shop' where id = NEW.vehicle_id and status != 'On Trip';
        if not found then raise exception 'Cannot perform maintenance on vehicle that is currently On Trip.'; end if;
    end if;
    return NEW;
end;
$$ language plpgsql;
create trigger maintenance_started_trigger after insert on public.maintenance_logs for each row execute function public.on_maintenance_started();

create or replace function public.on_maintenance_closed() returns trigger as $$
begin
    if NEW.is_active = false and OLD.is_active = true then
        update public.vehicles set status = 'Available' where id = NEW.vehicle_id;
    end if;
    return NEW;
end;
$$ language plpgsql;
create trigger maintenance_closed_trigger after update on public.maintenance_logs for each row execute function public.on_maintenance_closed();


-- =========================================================
-- PART 4: VIEWS (For Reports & Analytics)
-- =========================================================

create or replace view public.vehicle_operational_cost as
select 
    v.id, v.registration_number, v.name_model, v.acquisition_cost,
    coalesce(sum(f.cost), 0) as fuel_cost,
    coalesce(sum(m.cost), 0) as maintenance_cost,
    coalesce(sum(e.amount), 0) as other_expenses,
    (coalesce(sum(f.cost), 0) + coalesce(sum(m.cost), 0) + coalesce(sum(e.amount), 0)) as total_operational_cost
from public.vehicles v
left join public.fuel_logs f on v.id = f.vehicle_id
left join public.maintenance_logs m on v.id = m.vehicle_id
left join public.expenses e on v.id = e.vehicle_id
group by v.id, v.registration_number, v.name_model, v.acquisition_cost;

create or replace view public.vehicle_revenue as
select v.id, coalesce(sum(t.revenue), 0) as total_revenue
from public.vehicles v left join public.trips t on v.id = t.vehicle_id
where t.status = 'Completed' and t.revenue is not null
group by v.id;

create or replace view public.vehicle_roi as
select 
    voc.id as vehicle_id, voc.registration_number, voc.name_model, voc.acquisition_cost,
    vr.total_revenue, voc.total_operational_cost,
    case when voc.acquisition_cost > 0 then (vr.total_revenue - voc.total_operational_cost) / voc.acquisition_cost else null end as roi
from public.vehicle_operational_cost voc
join public.vehicle_revenue vr on voc.id = vr.id;
