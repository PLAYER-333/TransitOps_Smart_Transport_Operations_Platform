import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Wrench, Fuel, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { format } from 'date-fns'

interface VehicleDetail {
  id: string
  registration_number: string
  name_model: string
  type: string
  max_load_capacity: number
  odometer: number
  acquisition_cost: number
  region: string | null
  status: string
  created_at: string
}

interface MaintenanceLog {
  id: string
  description: string
  cost: number
  is_active: boolean
  created_at: string
}

interface FuelLog {
  id: string
  liters: number
  cost: number
  log_date: string
}

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([])
  const [fuel, setFuel] = useState<FuelLog[]>([])
  const [opCost, setOpCost] = useState<{ fuel_cost: number; maintenance_cost: number; total_operational_cost: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true

    async function load(vehicleId: string) {
      const [vRes, mRes, fRes, costRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', vehicleId).single(),
        supabase.from('maintenance_logs').select('id, description, cost, is_active, created_at').eq('vehicle_id', vehicleId).order('created_at', { ascending: false }).limit(10),
        supabase.from('fuel_logs').select('id, liters, cost, log_date').eq('vehicle_id', vehicleId).order('log_date', { ascending: false }).limit(10),
        supabase.from('vehicle_operational_cost').select('fuel_cost, maintenance_cost, total_operational_cost').eq('id', vehicleId).single(),
      ])
      if (!mounted) return
      if ((vRes as any).data) setVehicle((vRes as any).data as VehicleDetail)
      if (mRes.data) setMaintenance(mRes.data as MaintenanceLog[])
      if (fRes.data) setFuel(fRes.data as FuelLog[])
      if ((costRes as any).data) setOpCost((costRes as any).data as typeof opCost)
      setLoading(false)
    }

    load(id)
    return () => { mounted = false }
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" label="Loading vehicle…" />
    </div>
  )

  if (!vehicle) return (
    <div className="text-center py-24 text-content-secondary">Vehicle not found.</div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Vehicles
      </button>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-bg">
            <Truck className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-heading-1 text-content-primary">{vehicle.name_model}</h2>
              <Badge status={vehicle.status} />
            </div>
            <p className="text-body text-content-secondary font-mono">{vehicle.registration_number}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-caption text-content-secondary">
              <span>Type: <strong className="text-content-primary">{vehicle.type}</strong></span>
              <span>Region: <strong className="text-content-primary">{vehicle.region ?? '—'}</strong></span>
              <span>Odometer: <strong className="text-content-primary">{vehicle.odometer.toLocaleString()} km</strong></span>
              <span>Capacity: <strong className="text-content-primary">{vehicle.max_load_capacity.toLocaleString()} kg</strong></span>
              <span>Acquired: <strong className="text-content-primary">₹{vehicle.acquisition_cost.toLocaleString()}</strong></span>
              <span>Added: <strong className="text-content-primary">{format(new Date(vehicle.created_at), 'dd MMM yyyy')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational cost summary */}
      {opCost && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-content-secondary mb-1">
              <Fuel className="w-4 h-4 text-accent" />
              <span className="text-caption font-medium uppercase tracking-wide">Fuel Cost</span>
            </div>
            <p className="text-2xl font-bold text-content-primary">₹{opCost.fuel_cost.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-content-secondary mb-1">
              <Wrench className="w-4 h-4 text-status-in-shop" />
              <span className="text-caption font-medium uppercase tracking-wide">Maintenance Cost</span>
            </div>
            <p className="text-2xl font-bold text-content-primary">₹{opCost.maintenance_cost.toLocaleString()}</p>
          </div>
          <div className="card p-4 border-primary/20">
            <div className="flex items-center gap-2 text-content-secondary mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-caption font-medium uppercase tracking-wide">Total Op. Cost</span>
            </div>
            <p className="text-2xl font-bold text-primary">₹{opCost.total_operational_cost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Maintenance history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Wrench className="w-4 h-4 text-status-in-shop" />
          <h3 className="text-heading-3 text-content-primary">Recent Maintenance</h3>
        </div>
        {maintenance.length === 0 ? (
          <p className="px-5 py-8 text-content-secondary text-body text-center">No maintenance records.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {maintenance.map(m => (
              <div key={m.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-body text-content-primary">{m.description}</p>
                  <p className="text-caption text-content-secondary">{format(new Date(m.created_at), 'dd MMM yyyy')}</p>
                </div>
                <Badge status={m.is_active ? 'Active' : 'Closed'} />
                <span className="text-body font-medium text-content-primary">₹{m.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fuel history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Fuel className="w-4 h-4 text-accent" />
          <h3 className="text-heading-3 text-content-primary">Recent Fuel Logs</h3>
        </div>
        {fuel.length === 0 ? (
          <p className="px-5 py-8 text-content-secondary text-body text-center">No fuel logs.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {fuel.map(f => (
              <div key={f.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-body text-content-primary">{f.liters.toFixed(1)} L</p>
                  <p className="text-caption text-content-secondary">{format(new Date(f.log_date), 'dd MMM yyyy')}</p>
                </div>
                <span className="text-body font-medium text-content-primary">₹{f.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
