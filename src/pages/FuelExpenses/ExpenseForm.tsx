import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ExpenseFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Option {
  id: string
  label: string
}

const EXPENSE_CATEGORIES = ['Tolls', 'Parking', 'Fines', 'Cleaning', 'Other']

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Option[]>([])

  const [form, setForm] = useState({
    vehicle_id: '',
    category: 'Tolls',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: '',
  })

  useEffect(() => {
    let mounted = true
    async function loadData() {
      const { data: vData } = await supabase.from('vehicles').select('id, registration_number, name_model')
      
      if (!mounted) return
      if (vData) {
        setVehicles((vData as any[]).map(v => ({
          id: v.id,
          label: `${v.registration_number} - ${v.name_model}`
        })))
      }
      setDataLoading(false)
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      vehicle_id: form.vehicle_id,
      category: form.category,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      note: form.note.trim() || null,
    }

    const { error: err } = await supabase.from('expenses').insert(payload as any)

    setLoading(false)

    if (err) {
      setError(err.message || 'Unable to log expense.')
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
        <label htmlFor="ef-vehicle" className="form-label">Vehicle *</label>
        <select
          id="ef-vehicle"
          required
          value={form.vehicle_id}
          onChange={e => set('vehicle_id', e.target.value)}
          className="form-input"
        >
          <option value="" disabled>Select vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ef-cat" className="form-label">Category *</label>
          <select
            id="ef-cat"
            required
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="form-input"
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ef-amount" className="form-label">Amount (₹) *</label>
          <input
            id="ef-amount"
            type="number"
            min="0"
            required
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ef-date" className="form-label">Date *</label>
        <input
          id="ef-date"
          type="date"
          required
          value={form.expense_date}
          onChange={e => set('expense_date', e.target.value)}
          className="form-input"
        />
      </div>

      <div>
        <label htmlFor="ef-note" className="form-label">Note (Optional)</label>
        <textarea
          id="ef-note"
          rows={2}
          value={form.note}
          onChange={e => set('note', e.target.value)}
          className="form-input resize-none"
          placeholder="e.g. Toll booth #4 on NH48"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          disabled={loading || !form.vehicle_id || !form.amount || !form.expense_date}
          className="btn-primary"
        >
          {loading ? 'Saving…' : 'Log Expense'}
        </button>
      </div>
    </form>
  )
}
