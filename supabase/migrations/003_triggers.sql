-- ---------------------------------------------------------
-- TRIGGER FUNCTIONS
-- ---------------------------------------------------------

-- 1. Trip Dispatched
create or replace function public.on_trip_dispatched()
returns trigger as $$
begin
    if NEW.status = 'Dispatched' and OLD.status = 'Draft' then
        -- Mark vehicle as 'On Trip'
        update public.vehicles 
        set status = 'On Trip' 
        where id = NEW.vehicle_id and status = 'Available';
        
        if not found then
            raise exception 'Vehicle is not available for dispatch.';
        end if;
        
        -- Mark driver as 'On Trip'
        update public.drivers 
        set status = 'On Trip' 
        where id = NEW.driver_id and status = 'Available';
        
        if not found then
            raise exception 'Driver is not available for dispatch.';
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger trip_dispatched_trigger
    after update on public.trips
    for each row
    execute function public.on_trip_dispatched();

-- 2. Trip Completed
create or replace function public.on_trip_completed()
returns trigger as $$
begin
    if NEW.status = 'Completed' and OLD.status = 'Dispatched' then
        -- Free up vehicle
        update public.vehicles 
        set status = 'Available' 
        where id = NEW.vehicle_id;
        
        -- Update vehicle odometer if final odometer provided
        if NEW.final_odometer is not null then
            update public.vehicles 
            set odometer = greatest(odometer, NEW.final_odometer)
            where id = NEW.vehicle_id;
        end if;

        -- Free up driver
        update public.drivers 
        set status = 'Available' 
        where id = NEW.driver_id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger trip_completed_trigger
    after update on public.trips
    for each row
    execute function public.on_trip_completed();

-- 3. Trip Cancelled
create or replace function public.on_trip_cancelled()
returns trigger as $$
begin
    if NEW.status = 'Cancelled' and OLD.status = 'Dispatched' then
        -- Free up vehicle
        update public.vehicles set status = 'Available' where id = NEW.vehicle_id;
        -- Free up driver
        update public.drivers set status = 'Available' where id = NEW.driver_id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger trip_cancelled_trigger
    after update on public.trips
    for each row
    execute function public.on_trip_cancelled();

-- 4. Maintenance Started
create or replace function public.on_maintenance_started()
returns trigger as $$
begin
    if NEW.is_active = true then
        update public.vehicles 
        set status = 'In Shop' 
        where id = NEW.vehicle_id and status != 'On Trip';
        
        if not found then
            raise exception 'Cannot perform maintenance on vehicle that is currently On Trip.';
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger maintenance_started_trigger
    after insert on public.maintenance_logs
    for each row
    execute function public.on_maintenance_started();

-- 5. Maintenance Closed
create or replace function public.on_maintenance_closed()
returns trigger as $$
begin
    if NEW.is_active = false and OLD.is_active = true then
        update public.vehicles 
        set status = 'Available' 
        where id = NEW.vehicle_id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger maintenance_closed_trigger
    after update on public.maintenance_logs
    for each row
    execute function public.on_maintenance_closed();
