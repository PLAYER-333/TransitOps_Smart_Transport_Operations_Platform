-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type role_enum as enum ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
create type vehicle_status_enum as enum ('Available', 'On Trip', 'In Shop', 'Retired');
create type driver_status_enum as enum ('Available', 'On Trip', 'Off Duty', 'Suspended');
create type trip_status_enum as enum ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- ---------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------

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

-- Updated_at triggers for tracking modifications
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
