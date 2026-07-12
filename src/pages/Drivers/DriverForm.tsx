import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface Driver {
  id: string
  name: string
  license_number: string
  license_category: string
  license_expiry: string
  contact_number: string
  safety_score: number
  region: string | null
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
}

interface DriverFormProps {
  driver?: Driver | null
  onSuccess: () => void
  onCancel: () => void
}

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HPMV', 'HTV', 'LMV-TR', 'MCWG', 'Other']
const DRIVER_STATUSES: Driver['status'][] = ['Available', 'On Trip', 'Off Duty', 'Suspended']

export function DriverForm({ driver, onSuccess, onCancel }: DriverFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: driver?.name ?? '',
    license_number: driver?.license_number ?? '',
    license_category: driver?.license_category ?? 'HMV',
    license_expiry: driver?.license_expiry ?? '',
    contact_number: driver?.contact_number ?? '',
    safety_score: driver?.safety_score ?? 100,
    region: driver?.region ?? '',
    status: driver?.status ?? 'Available' as Driver['status'],
  })

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      license_number: form.license_number.trim().toUpperCase(),
      license_category: form.license_category,
      license_expiry: form.license_expiry,
      contact_number: form.contact_number.trim(),
      safety_score: Number(form.safety_score),
      region: form.region.trim() || null,
      status: form.status,
    }

    let err: any;
    if (driver) {
      // @ts-ignore
      const res = await supabase.from('drivers').update(payload as any).eq('id', driver.id)
      err = res.error
    } else {
      // @ts-ignore
      const res = await supabase.from('drivers').insert(payload as any)
      err = res.error
    }

    setLoading(false)

    if (err) {
      if (err.code === '23505') {
        setError('A driver with this license number already exists.')
      } else {
        setError('Unable to save driver. Please check your input and try again.')
      }
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate id="driver-form">
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="df-name" className="form-label">Full Name *</label>
          <input
            id="df-name"
            type="text"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Rajesh Kumar"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="df-license" className="form-label">License Number *</label>
          <input
            id="df-license"
            type="text"
            required
            value={form.license_number}
            onChange={e => set('license_number', e.target.value)}
            placeholder="MH0120000001234"
            className="form-input uppercase"
            disabled={!!driver}
          />
          {driver && (
            <p className="text-xs text-content-secondary mt-1">License number cannot be changed.</p>
          )}
        </div>

        <div>
          <label htmlFor="df-category" className="form-label">License Category *</label>
          <select
            id="df-category"
            value={form.license_category}
            onChange={e => set('license_category', e.target.value)}
            className="form-input"
          >
            {LICENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="df-expiry" className="form-label">License Expiry Date *</label>
          <input
            id="df-expiry"
            type="date"
            required
            value={form.license_expiry}
            onChange={e => set('license_expiry', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="df-contact" className="form-label">Contact Number</label>
          <input
            id="df-contact"
            type="tel"
            value={form.contact_number}
            onChange={e => set('contact_number', e.target.value)}
            placeholder="+91 98765 43210"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="df-score" className="form-label">Safety Score (0–100)</label>
          <input
            id="df-score"
            type="number"
            min={0}
            max={100}
            value={form.safety_score}
            onChange={e => set('safety_score', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="df-status" className="form-label">Status *</label>
          <select
            id="df-status"
            value={form.status}
            onChange={e => set('status', e.target.value as Driver['status'])}
            className="form-input"
          >
            {DRIVER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="df-region" className="form-label">Region</label>
          <input
            id="df-region"
            type="text"
            value={form.region}
            onChange={e => set('region', e.target.value)}
            placeholder="e.g. North, South"
            className="form-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          id="driver-form-submit"
          disabled={loading || !form.name || !form.license_number || !form.license_expiry}
          className="btn-primary"
        >
          {loading ? 'Saving…' : driver ? 'Save Changes' : 'Add Driver'}
        </button>
      </div>
    </form>
  )
}
