import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface FuelLogFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Option {
  id: string
  label: string
}

export function FuelLogForm({ onSuccess, onCancel }: FuelLogFormProps) {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Option[]>([])
  const [trips, setTrips] = useState<Option[]>([])

  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    cost: '',
    log_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    let mounted = true
    async function loadData() {
      // Drivers only see their own vehicles? Actually, we'll let them select any vehicle
      // their region allows, or just use RLS. 
      // The simplest UI is to fetch all allowed vehicles.
      const { data: vData } = await supabase.from('vehicles').select('id, registration_number, name_model')
      
      if (!mounted) return
      if (vData) {
        setVehicles(vData.map(v => ({
          id: v.id,
          label: `${v.registration_number} - ${v.name_model}`
        })))
      }
      setDataLoading(false)
    }
    loadData()
    return () => { mounted = false }
  }, [])

  // When vehicle changes, fetch its recent trips
  useEffect(() => {
    if (!form.vehicle_id) {
      setTrips([])
      setForm(prev => ({ ...prev, trip_id: '' }))
      return
    }

    let mounted = true
    async function fetchTrips() {
      const { data } = await supabase
        .from('trips')
        .select('id, source, destination, created_at')
        .eq('vehicle_id', form.vehicle_id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (!mounted) return
      if (data) {
        setTrips(data.map(t => ({
          id: t.id,
          label: `${t.source} to ${t.destination} (${new Date(t.created_at).toLocaleDateString()})`
        })))
      }
    }
    fetchTrips()
    return () => { mounted = false }
  }, [form.vehicle_id])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      vehicle_id: form.vehicle_id,
      trip_id: form.trip_id || null,
      liters: Number(form.liters),
      cost: Number(form.cost),
      log_date: form.log_date,
    }

    const { error: err } = await supabase.from('fuel_logs').insert(payload)

    setLoading(false)

    if (err) {
      setError(err.message || 'Unable to log fuel.')
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
        <label htmlFor="ff-vehicle" className="form-label">Vehicle *</label>
        <select
          id="ff-vehicle"
          required
          value={form.vehicle_id}
          onChange={e => set('vehicle_id', e.target.value)}
          className="form-input"
        >
          <option value="" disabled>Select vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="ff-trip" className="form-label">Associated Trip (Optional)</label>
        <select
          id="ff-trip"
          value={form.trip_id}
          onChange={e => set('trip_id', e.target.value)}
          className="form-input"
          disabled={!form.vehicle_id || trips.length === 0}
        >
          <option value="">No specific trip / General refuel</option>
          {trips.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ff-liters" className="form-label">Volume (Liters) *</label>
          <input
            id="ff-liters"
            type="number"
            step="0.1"
            min="0"
            required
            value={form.liters}
            onChange={e => set('liters', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="ff-cost" className="form-label">Total Cost (₹) *</label>
          <input
            id="ff-cost"
            type="number"
            min="0"
            required
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ff-date" className="form-label">Date *</label>
        <input
          id="ff-date"
          type="date"
          required
          value={form.log_date}
          onChange={e => set('log_date', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          disabled={loading || !form.vehicle_id || !form.liters || !form.cost || !form.log_date}
          className="btn-primary"
        >
          {loading ? 'Saving…' : 'Log Fuel'}
        </button>
      </div>
    </form>
  )
}
