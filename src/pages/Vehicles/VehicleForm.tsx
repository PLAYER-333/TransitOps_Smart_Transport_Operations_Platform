import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface Vehicle {
  id: string
  registration_number: string
  name_model: string
  type: string
  max_load_capacity: number
  odometer: number
  acquisition_cost: number
  region: string | null
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
}

interface VehicleFormProps {
  vehicle?: Vehicle | null
  onSuccess: () => void
  onCancel: () => void
}

const VEHICLE_TYPES = ['Truck', 'Van', 'Lorry', 'Tanker', 'Flatbed', 'Refrigerated', 'Bus', 'Pickup', 'Other']
const VEHICLE_STATUSES: Vehicle['status'][] = ['Available', 'On Trip', 'In Shop', 'Retired']

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    registration_number: vehicle?.registration_number ?? '',
    name_model: vehicle?.name_model ?? '',
    type: vehicle?.type ?? 'Truck',
    max_load_capacity: vehicle?.max_load_capacity ?? 0,
    odometer: vehicle?.odometer ?? 0,
    acquisition_cost: vehicle?.acquisition_cost ?? 0,
    region: vehicle?.region ?? '',
    status: vehicle?.status ?? 'Available' as Vehicle['status'],
  })

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      registration_number: form.registration_number.trim().toUpperCase(),
      name_model: form.name_model.trim(),
      type: form.type,
      max_load_capacity: Number(form.max_load_capacity),
      odometer: Number(form.odometer),
      acquisition_cost: Number(form.acquisition_cost),
      region: form.region.trim() || null,
      status: form.status,
    }

    let err: any;
    if (vehicle) {
      // @ts-ignore
      const res = await supabase.from('vehicles').update(payload as any).eq('id', vehicle.id)
      err = res.error
    } else {
      // @ts-ignore
      const res = await supabase.from('vehicles').insert(payload as any)
      err = res.error
    }

    setLoading(false)

    if (err) {
      if (err.code === '23505') {
        setError('A vehicle with this registration number already exists.')
      } else {
        setError('Unable to save vehicle. Please check your input and try again.')
      }
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate id="vehicle-form">
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vf-reg" className="form-label">Registration Number *</label>
          <input
            id="vf-reg"
            type="text"
            required
            value={form.registration_number}
            onChange={e => set('registration_number', e.target.value)}
            placeholder="ABC-1234"
            className="form-input uppercase"
            disabled={!!vehicle} // Cannot change reg number after creation
          />
          {vehicle && (
            <p className="text-xs text-content-secondary mt-1">Registration number cannot be changed.</p>
          )}
        </div>

        <div>
          <label htmlFor="vf-model" className="form-label">Name / Model *</label>
          <input
            id="vf-model"
            type="text"
            required
            value={form.name_model}
            onChange={e => set('name_model', e.target.value)}
            placeholder="Tata LPT 1516"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="vf-type" className="form-label">Vehicle Type *</label>
          <select
            id="vf-type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="form-input"
          >
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="vf-status" className="form-label">Status *</label>
          <select
            id="vf-status"
            value={form.status}
            onChange={e => set('status', e.target.value as Vehicle['status'])}
            className="form-input"
          >
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="vf-capacity" className="form-label">Max Load Capacity (kg)</label>
          <input
            id="vf-capacity"
            type="number"
            min={0}
            step={100}
            value={form.max_load_capacity}
            onChange={e => set('max_load_capacity', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="vf-odometer" className="form-label">Odometer (km)</label>
          <input
            id="vf-odometer"
            type="number"
            min={0}
            value={form.odometer}
            onChange={e => set('odometer', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="vf-cost" className="form-label">Acquisition Cost (₹)</label>
          <input
            id="vf-cost"
            type="number"
            min={0}
            step={1000}
            value={form.acquisition_cost}
            onChange={e => set('acquisition_cost', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="vf-region" className="form-label">Region</label>
          <input
            id="vf-region"
            type="text"
            value={form.region}
            onChange={e => set('region', e.target.value)}
            placeholder="e.g. North, South, East"
            className="form-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          id="vehicle-form-submit"
          disabled={loading || !form.registration_number || !form.name_model}
          className="btn-primary"
        >
          {loading ? 'Saving…' : vehicle ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  )
}
