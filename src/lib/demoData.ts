// Demo seed data — used when no Supabase credentials are configured.
// Realistic mock data so all UI pages render correctly.

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'manager@transitops.demo',
  role: 'fleet_manager' as const,
  region: null,
}

export const DEMO_VEHICLES = [
  { id: 'v1', registration_number: 'MH04AB1234', name_model: 'Tata Prima 4928.S', type: 'Heavy Truck', max_load_capacity: 49000, odometer: 128450, acquisition_cost: 3200000, region: 'West', status: 'Available', created_at: '2023-01-15T08:00:00Z', updated_at: '2024-06-01T10:00:00Z' },
  { id: 'v2', registration_number: 'KA05CD5678', name_model: 'Ashok Leyland 3518', type: 'Heavy Truck', max_load_capacity: 35000, odometer: 87230, acquisition_cost: 2800000, region: 'South', status: 'On Trip', created_at: '2023-03-10T08:00:00Z', updated_at: '2024-06-10T10:00:00Z' },
  { id: 'v3', registration_number: 'DL01EF9012', name_model: 'Eicher Pro 6031', type: 'Medium Truck', max_load_capacity: 16000, odometer: 54120, acquisition_cost: 1900000, region: 'North', status: 'In Shop', created_at: '2023-05-20T08:00:00Z', updated_at: '2024-06-08T10:00:00Z' },
  { id: 'v4', registration_number: 'GJ06GH3456', name_model: 'Mahindra Blazo X 40', type: 'Heavy Truck', max_load_capacity: 40000, odometer: 201000, acquisition_cost: 3500000, region: 'West', status: 'Retired', created_at: '2021-06-01T08:00:00Z', updated_at: '2023-12-01T10:00:00Z' },
  { id: 'v5', registration_number: 'TN07IJ7890', name_model: 'VECV VE 1214', type: 'Light Truck', max_load_capacity: 12000, odometer: 33400, acquisition_cost: 1400000, region: 'South', status: 'Available', created_at: '2024-01-05T08:00:00Z', updated_at: '2024-06-05T10:00:00Z' },
  { id: 'v6', registration_number: 'RJ08KL2345', name_model: 'BharatBenz 3523', type: 'Heavy Truck', max_load_capacity: 35000, odometer: 72000, acquisition_cost: 2900000, region: 'North', status: 'Available', created_at: '2023-08-12T08:00:00Z', updated_at: '2024-06-09T10:00:00Z' },
]

export const DEMO_DRIVERS = [
  { id: 'd1', name: 'Rajesh Kumar', license_number: 'MH0120001234', license_category: 'HMV', license_expiry: '2026-08-15', contact_number: '+91 98765 43210', safety_score: 92, region: 'West', status: 'Available', created_at: '2023-01-20T08:00:00Z', updated_at: '2024-06-01T10:00:00Z' },
  { id: 'd2', name: 'Suresh Patel', license_number: 'GJ0620005678', license_category: 'HTV', license_expiry: '2025-03-22', contact_number: '+91 87654 32109', safety_score: 78, region: 'West', status: 'On Trip', created_at: '2023-02-14T08:00:00Z', updated_at: '2024-06-10T10:00:00Z' },
  { id: 'd3', name: 'Mohan Singh', license_number: 'DL0120009012', license_category: 'HMV', license_expiry: '2027-11-30', contact_number: '+91 76543 21098', safety_score: 88, region: 'North', status: 'Available', created_at: '2023-03-05T08:00:00Z', updated_at: '2024-06-01T10:00:00Z' },
  { id: 'd4', name: 'Arjun Reddy', license_number: 'TN0720003456', license_category: 'HPMV', license_expiry: '2024-12-10', contact_number: '+91 65432 10987', safety_score: 55, region: 'South', status: 'Off Duty', created_at: '2022-09-12T08:00:00Z', updated_at: '2024-05-01T10:00:00Z' },
  { id: 'd5', name: 'Vikram Sharma', license_number: 'KA0520007890', license_category: 'HTV', license_expiry: '2026-05-18', contact_number: '+91 54321 09876', safety_score: 95, region: 'South', status: 'Available', created_at: '2023-07-22T08:00:00Z', updated_at: '2024-06-01T10:00:00Z' },
  { id: 'd6', name: 'Ramesh Yadav', license_number: 'RJ0820002345', license_category: 'HMV', license_expiry: '2025-09-05', contact_number: '+91 43210 98765', safety_score: 70, region: 'North', status: 'Suspended', created_at: '2022-11-30T08:00:00Z', updated_at: '2024-04-15T10:00:00Z' },
]

export const DEMO_TRIPS = [
  { id: 't1', source: 'Mumbai', destination: 'Pune', vehicle_id: 'v2', driver_id: 'd2', cargo_weight: 28000, planned_distance: 150, final_odometer: null, fuel_consumed: null, revenue: null, status: 'Dispatched', created_by: 'demo-user-001', created_at: '2024-06-10T06:00:00Z', updated_at: '2024-06-10T06:30:00Z', vehicles: { registration_number: 'KA05CD5678', name_model: 'Ashok Leyland 3518' }, drivers: { name: 'Suresh Patel' } },
  { id: 't2', source: 'Delhi', destination: 'Jaipur', vehicle_id: 'v6', driver_id: 'd3', cargo_weight: 30000, planned_distance: 280, final_odometer: 72280, fuel_consumed: 84.5, revenue: 45000, status: 'Completed', created_by: 'demo-user-001', created_at: '2024-06-08T05:00:00Z', updated_at: '2024-06-08T19:00:00Z', vehicles: { registration_number: 'RJ08KL2345', name_model: 'BharatBenz 3523' }, drivers: { name: 'Mohan Singh' } },
  { id: 't3', source: 'Bangalore', destination: 'Chennai', vehicle_id: 'v5', driver_id: 'd5', cargo_weight: 10000, planned_distance: 340, final_odometer: null, fuel_consumed: null, revenue: null, status: 'Draft', created_by: 'demo-user-001', created_at: '2024-06-11T09:00:00Z', updated_at: '2024-06-11T09:00:00Z', vehicles: { registration_number: 'TN07IJ7890', name_model: 'VECV VE 1214' }, drivers: { name: 'Vikram Sharma' } },
  { id: 't4', source: 'Ahmedabad', destination: 'Surat', vehicle_id: 'v1', driver_id: 'd1', cargo_weight: 42000, planned_distance: 265, final_odometer: 128715, fuel_consumed: 95.2, revenue: 62000, status: 'Completed', created_by: 'demo-user-001', created_at: '2024-06-05T07:00:00Z', updated_at: '2024-06-05T21:00:00Z', vehicles: { registration_number: 'MH04AB1234', name_model: 'Tata Prima 4928.S' }, drivers: { name: 'Rajesh Kumar' } },
  { id: 't5', source: 'Hyderabad', destination: 'Vijayawada', vehicle_id: 'v5', driver_id: 'd1', cargo_weight: 9500, planned_distance: 275, final_odometer: null, fuel_consumed: null, revenue: null, status: 'Cancelled', created_by: 'demo-user-001', created_at: '2024-06-03T10:00:00Z', updated_at: '2024-06-03T14:00:00Z', vehicles: { registration_number: 'TN07IJ7890', name_model: 'VECV VE 1214' }, drivers: { name: 'Rajesh Kumar' } },
]

export const DEMO_MAINTENANCE = [
  { id: 'm1', vehicle_id: 'v3', description: 'Engine overhaul and oil change after 50k km service', cost: 45000, is_active: true, created_at: '2024-06-08T09:00:00Z', closed_at: null },
  { id: 'm2', vehicle_id: 'v1', description: 'Tyre replacement – all 12 tyres', cost: 72000, is_active: false, created_at: '2024-05-12T08:00:00Z', closed_at: '2024-05-14T17:00:00Z' },
  { id: 'm3', vehicle_id: 'v6', description: 'Brake pad and disc replacement', cost: 18500, is_active: false, created_at: '2024-04-20T10:00:00Z', closed_at: '2024-04-21T16:00:00Z' },
]

export const DEMO_FUEL_LOGS = [
  { id: 'f1', vehicle_id: 'v1', trip_id: 't4', liters: 95.2, cost: 9520, log_date: '2024-06-05', created_at: '2024-06-05T21:00:00Z' },
  { id: 'f2', vehicle_id: 'v2', trip_id: 't1', liters: 50.0, cost: 5000, log_date: '2024-06-10', created_at: '2024-06-10T06:30:00Z' },
  { id: 'f3', vehicle_id: 'v6', trip_id: 't2', liters: 84.5, cost: 8450, log_date: '2024-06-08', created_at: '2024-06-08T19:00:00Z' },
  { id: 'f4', vehicle_id: 'v5', trip_id: null, liters: 30.0, cost: 3000, log_date: '2024-06-09', created_at: '2024-06-09T12:00:00Z' },
]

export const DEMO_EXPENSES = [
  { id: 'e1', vehicle_id: 'v1', category: 'Tolls', amount: 1200, expense_date: '2024-06-05', note: 'NH48 toll booth', created_at: '2024-06-05T21:00:00Z' },
  { id: 'e2', vehicle_id: 'v2', category: 'Parking', amount: 500, expense_date: '2024-06-10', note: 'Overnight parking at Pune depot', created_at: '2024-06-10T23:00:00Z' },
  { id: 'e3', vehicle_id: 'v6', category: 'Fines', amount: 2500, expense_date: '2024-06-07', note: null, created_at: '2024-06-07T14:00:00Z' },
]

export const DEMO_USERS = [
  { user_id: 'demo-user-001', email: 'manager@transitops.demo', role: 'fleet_manager', region: null, created_at: '2023-01-01T00:00:00Z' },
  { user_id: 'demo-user-002', email: 'driver@transitops.demo', role: 'driver', region: 'West', created_at: '2023-02-01T00:00:00Z' },
  { user_id: 'demo-user-003', email: 'safety@transitops.demo', role: 'safety_officer', region: null, created_at: '2023-03-01T00:00:00Z' },
  { user_id: 'demo-user-004', email: 'finance@transitops.demo', role: 'financial_analyst', region: null, created_at: '2023-04-01T00:00:00Z' },
]
