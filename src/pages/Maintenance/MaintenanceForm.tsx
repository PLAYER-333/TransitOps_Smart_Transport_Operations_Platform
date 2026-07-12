import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface MaintenanceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Option {
  id: string
  label: string
}

export function MaintenanceForm({ onSuccess, onCancel }: MaintenanceFormProps) {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Option[]>([])

  const [form, setForm] = useState({
    vehicle_id: '',
    description: '',
    cost: '',
  })

  useEffect(() => {
    let mounted = true
    async function loadVehicles() {
      // Allow maintenance on 'Available' or 'Retired' (to prep for sale) or even 'In Shop' (additional work)
      // We generally wouldn't allow it for 'On Trip' vehicles.
      const { data } = await supabase
        .from('vehicles')
        .select('id, registration_number, name_model')
        .neq('status', 'On Trip')

      if (!mounted) return

      if (data) {
        setVehicles(data.map(v => ({
          id: v.id,
          label: `${v.registration_number} - ${v.name_model}`
        })))
      }
      setDataLoading(false)
    }
    loadVehicles()
    return () => { mounted = false }
  }, [])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // DB trigger will automatically change vehicle status to 'In Shop'
    const payload = {
      vehicle_id: form.vehicle_id,
      description: form.description.trim(),
      cost: Number(form.cost),
      is_active: true,
    }

    const { error: err } = await supabase.from('maintenance_logs').insert(payload)

    setLoading(false)

    if (err) {
      setError(err.message || 'Unable to log maintenance. Ensure vehicle is not already on a trip.')
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

      <div>
        <label htmlFor="mf-vehicle" className="form-label">Vehicle *</label>
        <select
          id="mf-vehicle"
          required
          value={form.vehicle_id}
          onChange={e => set('vehicle_id', e.target.value)}
          className="form-input"
        >
          <option value="" disabled>Select vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        {vehicles.length === 0 && <p className="text-xs text-red-500 mt-1">No vehicles available for maintenance.</p>}
      </div>

      <div>
        <label htmlFor="mf-desc" className="form-label">Description of Work *</label>
        <textarea
          id="mf-desc"
          required
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="e.g. Oil change and brake pad replacement"
          className="form-input resize-none"
        />
      </div>

      <div>
        <label htmlFor="mf-cost" className="form-label">Estimated/Actual Cost (₹) *</label>
        <input
          id="mf-cost"
          type="number"
          min={0}
          required
          value={form.cost}
          onChange={e => set('cost', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          disabled={loading || !form.vehicle_id || !form.description || !form.cost}
          className="btn-primary"
        >
          {loading ? 'Logging…' : 'Log Maintenance'}
        </button>
      </div>
    </form>
  )
}
