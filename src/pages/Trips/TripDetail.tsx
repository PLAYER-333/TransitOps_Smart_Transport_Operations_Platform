import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Route, Truck, User, Navigation, Scale, Fuel, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface TripDetail {
  id: string
  source: string
  destination: string
  vehicle_id: string
  driver_id: string
  cargo_weight: number
  planned_distance: number
  final_odometer: number | null
  fuel_consumed: number | null
  revenue: number | null
  status: string
  created_at: string
  vehicles: { registration_number: string; name_model: string } | null
  drivers: { name: string } | null
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Completion Form State (for Fleet Managers & Drivers to fill after trip finishes)
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionForm, setCompletionForm] = useState({
    final_odometer: '',
    fuel_consumed: '',
    revenue: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit = user?.role === 'fleet_manager' || user?.role === 'driver'

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function load(tripId: string) {
      const { data } = await supabase
        .from('trips')
        .select(`
          *,
          vehicles(registration_number, name_model),
          drivers(name)
        `)
        .eq('id', tripId)
        .single()
      
      if (!mounted) return
      if (data) {
        setTrip(data as unknown as TripDetail)
        setCompletionForm({
          final_odometer: (data as any).final_odometer?.toString() || '',
          fuel_consumed: (data as any).fuel_consumed?.toString() || '',
          revenue: (data as any).revenue?.toString() || '',
        })
      }
      setLoading(false)
    }
    load(id)
    return () => { mounted = false }
  }, [id])

  const handleUpdateCompletionData = async (e: FormEvent) => {
    e.preventDefault()
    if (!trip) return
    setSubmitting(true)
    setError(null)

    const payload = {
      final_odometer: completionForm.final_odometer ? Number(completionForm.final_odometer) : null,
      fuel_consumed: completionForm.fuel_consumed ? Number(completionForm.fuel_consumed) : null,
      revenue: completionForm.revenue ? Number(completionForm.revenue) : null,
    }

    // @ts-ignore
    const { error: err } = await supabase.from('trips').update(payload as any).eq('id', trip.id)
    
    setSubmitting(false)
    if (err) {
      setError(err.message)
    } else {
      setTrip(prev => prev ? { ...prev, ...payload } : null)
      setShowCompletionForm(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" label="Loading trip…" />
    </div>
  )

  if (!trip) return (
    <div className="text-center py-24 text-content-secondary">Trip not found.</div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Trips
      </button>

      {/* Main Details */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-bg">
            <Route className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-heading-1 text-content-primary truncate max-w-full">
                {trip.source} → {trip.destination}
              </h2>
              <Badge status={trip.status} />
            </div>
            <p className="text-caption text-content-secondary">
              Created {format(new Date(trip.created_at), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8 border-t border-surface-border pt-6">
          <div>
            <div className="flex items-center gap-1.5 text-content-secondary mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-caption font-medium uppercase">Vehicle</span>
            </div>
            <p className="font-medium text-content-primary">{trip.vehicles?.registration_number}</p>
            <p className="text-xs text-content-secondary truncate">{trip.vehicles?.name_model}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-1.5 text-content-secondary mb-1">
              <User className="w-4 h-4" />
              <span className="text-caption font-medium uppercase">Driver</span>
            </div>
            <p className="font-medium text-content-primary truncate">{trip.drivers?.name}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-content-secondary mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-caption font-medium uppercase">Cargo Weight</span>
            </div>
            <p className="font-medium text-content-primary">{trip.cargo_weight.toLocaleString()} kg</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-content-secondary mb-1">
              <Navigation className="w-4 h-4" />
              <span className="text-caption font-medium uppercase">Planned Dist.</span>
            </div>
            <p className="font-medium text-content-primary">{trip.planned_distance.toLocaleString()} km</p>
          </div>
        </div>
      </div>

      {/* Completion Data section */}
      {(trip.status === 'Completed' || trip.final_odometer !== null) && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-heading-3 text-content-primary">Trip Closing Data</h3>
            {canEdit && !showCompletionForm && (
              <button className="btn-secondary" onClick={() => setShowCompletionForm(true)}>
                Edit Data
              </button>
            )}
          </div>

          {showCompletionForm ? (
            <form onSubmit={handleUpdateCompletionData} className="p-5 space-y-4 bg-surface-bg/50">
              {error && (
                <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cd-odo" className="form-label">Final Odometer (km)</label>
                  <input
                    id="cd-odo"
                    type="number"
                    value={completionForm.final_odometer}
                    onChange={e => setCompletionForm(prev => ({ ...prev, final_odometer: e.target.value }))}
                    className="form-input bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="cd-fuel" className="form-label">Fuel Consumed (L)</label>
                  <input
                    id="cd-fuel"
                    type="number"
                    step="0.1"
                    value={completionForm.fuel_consumed}
                    onChange={e => setCompletionForm(prev => ({ ...prev, fuel_consumed: e.target.value }))}
                    className="form-input bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="cd-rev" className="form-label">Revenue (₹)</label>
                  <input
                    id="cd-rev"
                    type="number"
                    value={completionForm.revenue}
                    onChange={e => setCompletionForm(prev => ({ ...prev, revenue: e.target.value }))}
                    className="form-input bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowCompletionForm(false)}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving…' : 'Save Trip Data'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
              <div className="p-5 flex flex-col gap-1 text-center">
                <span className="text-caption text-content-secondary uppercase">Final Odometer</span>
                <span className="text-xl font-medium text-content-primary">
                  {trip.final_odometer ? `${trip.final_odometer.toLocaleString()} km` : '—'}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-1 text-center">
                <span className="text-caption text-content-secondary uppercase">Fuel Consumed</span>
                <span className="text-xl font-medium text-content-primary flex items-center justify-center gap-1.5">
                  <Fuel className="w-4 h-4 text-accent" />
                  {trip.fuel_consumed ? `${trip.fuel_consumed} L` : '—'}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-1 text-center">
                <span className="text-caption text-content-secondary uppercase">Revenue</span>
                <span className="text-xl font-medium text-status-available flex items-center justify-center gap-1.5">
                  <IndianRupee className="w-4 h-4" />
                  {trip.revenue ? trip.revenue.toLocaleString() : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
