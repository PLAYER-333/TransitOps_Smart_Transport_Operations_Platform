-- ---------------------------------------------------------
-- VIEWS FOR ROLLUPS AND ROI
-- ---------------------------------------------------------

-- 1. Vehicle Operational Cost View
create or replace view public.vehicle_operational_cost as
select 
    v.id,
    v.registration_number,
    v.name_model,
    v.acquisition_cost,
    coalesce(sum(f.cost), 0) as fuel_cost,
    coalesce(sum(m.cost), 0) as maintenance_cost,
    coalesce(sum(e.amount), 0) as other_expenses,
    (coalesce(sum(f.cost), 0) + coalesce(sum(m.cost), 0) + coalesce(sum(e.amount), 0)) as total_operational_cost
from public.vehicles v
left join public.fuel_logs f on v.id = f.vehicle_id
left join public.maintenance_logs m on v.id = m.vehicle_id
left join public.expenses e on v.id = e.vehicle_id
group by v.id, v.registration_number, v.name_model, v.acquisition_cost;

-- 2. Vehicle Revenue View
create or replace view public.vehicle_revenue as
select 
    v.id,
    coalesce(sum(t.revenue), 0) as total_revenue
from public.vehicles v
left join public.trips t on v.id = t.vehicle_id
where t.status = 'Completed' and t.revenue is not null
group by v.id;

-- 3. Vehicle ROI View
-- ROI = (Total Revenue - Total Operational Cost) / Acquisition Cost
create or replace view public.vehicle_roi as
select 
    voc.id as vehicle_id,
    voc.registration_number,
    voc.name_model,
    voc.acquisition_cost,
    vr.total_revenue,
    voc.total_operational_cost,
    case 
        when voc.acquisition_cost > 0 then 
            (vr.total_revenue - voc.total_operational_cost) / voc.acquisition_cost
        else null 
    end as roi
from public.vehicle_operational_cost voc
join public.vehicle_revenue vr on voc.id = vr.id;
