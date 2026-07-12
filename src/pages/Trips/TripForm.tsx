import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface TripFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Option {
  id: string
  label: string
  capacity?: number
}

export function TripForm({ onSuccess, onCancel }: TripFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vehicles, setVehicles] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])

  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: 0,
    planned_distance: 0,
  })

  useEffect(() => {
    let mounted = true
    async function loadOptions() {
      // Only fetch Available vehicles and drivers to prevent assigning occupied resources.
      // DB triggers also enforce this as a secondary security measure.
      const [vRes, dRes] = await Promise.all([
        supabase.from('vehicles').select('id, registration_number, name_model, max_load_capacity').eq('status', 'Available'),
        supabase.from('drivers').select('id, name, license_category').eq('status', 'Available'),
      ])

      if (!mounted) return

      if (vRes.data) {
        setVehicles((vRes.data as any[]).map(v => ({
          id: v.id,
          label: `${v.registration_number} - ${v.name_model} (Max ${v.max_load_capacity}kg)`,
          capacity: v.max_load_capacity
        })))
      }
      if (dRes.data) {
        setDrivers((dRes.data as any[]).map(d => ({
          id: d.id,
          label: `${d.name} (${d.license_category})`
        })))
      }
      setDataLoading(false)
    }
    loadOptions()
    return () => { mounted = false }
  }, [])

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side cargo check
    const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id)
    if (selectedVehicle && selectedVehicle.capacity && Number(form.cargo_weight) > selectedVehicle.capacity) {
      setError(`Cargo weight exceeds vehicle's max capacity of ${selectedVehicle.capacity}kg.`)
      return
    }

    setLoading(true)

    const payload = {
      source: form.source.trim(),
      destination: form.destination.trim(),
      vehicle_id: form.vehicle_id,
      driver_id: form.driver_id,
      cargo_weight: Number(form.cargo_weight),
      planned_distance: Number(form.planned_distance),
      status: 'Draft' as const, // Always created as Draft first
      created_by: user?.id,
    }

    const { error: err } = await supabase.from('trips').insert(payload as any)

    setLoading(false)

    if (err) {
      setError(err.message || 'Unable to create trip. Ensure vehicle and driver are still available.')
      return
    }

    onSuccess()
  }

  if (dataLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tf-source" className="form-label">Source *</label>
          <input
            id="tf-source"
            type="text"
            required
            value={form.source}
            onChange={e => set('source', e.target.value)}
            placeholder="e.g. Mumbai Warehouse"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="tf-destination" className="form-label">Destination *</label>
          <input
            id="tf-destination"
            type="text"
            required
            value={form.destination}
            onChange={e => set('destination', e.target.value)}
            placeholder="e.g. Pune Distribution Center"
            className="form-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tf-vehicle" className="form-label">Assign Vehicle *</label>
          <select
            id="tf-vehicle"
            required
            value={form.vehicle_id}
            onChange={e => set('vehicle_id', e.target.value)}
            className="form-input"
          >
            <option value="" disabled>Select an available vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          {vehicles.length === 0 && <p className="text-xs text-red-500 mt-1">No vehicles currently available.</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tf-driver" className="form-label">Assign Driver *</label>
          <select
            id="tf-driver"
            required
            value={form.driver_id}
            onChange={e => set('driver_id', e.target.value)}
            className="form-input"
          >
            <option value="" disabled>Select an available driver</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          {drivers.length === 0 && <p className="text-xs text-red-500 mt-1">No drivers currently available.</p>}
        </div>

        <div>
          <label htmlFor="tf-cargo" className="form-label">Cargo Weight (kg) *</label>
          <input
            id="tf-cargo"
            type="number"
            min={0}
            required
            value={form.cargo_weight || ''}
            onChange={e => set('cargo_weight', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="tf-distance" className="form-label">Planned Distance (km) *</label>
          <input
            id="tf-distance"
            type="number"
            min={0}
            required
            value={form.planned_distance || ''}
            onChange={e => set('planned_distance', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          disabled={loading || !form.source || !form.destination || !form.vehicle_id || !form.driver_id || !form.cargo_weight || !form.planned_distance}
          className="btn-primary"
        >
          {loading ? 'Creating…' : 'Create Draft Trip'}
        </button>
      </div>
    </form>
  )
}
