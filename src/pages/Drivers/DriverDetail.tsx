import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Route, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { differenceInDays, parseISO, format } from 'date-fns'

interface DriverDetail {
  id: string
  name: string
  license_number: string
  license_category: string
  license_expiry: string
  contact_number: string
  safety_score: number
  region: string | null
  status: string
  created_at: string
}

interface Trip {
  id: string
  source: string
  destination: string
  status: string
  created_at: string
}

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [driver, setDriver] = useState<DriverDetail | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true

    async function load(driverId: string) {
      const [dRes, tRes] = await Promise.all([
        supabase.from('drivers').select('*').eq('id', driverId).single(),
        supabase.from('trips')
          .select('id, source, destination, status, created_at')
          .eq('driver_id', driverId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      if (!mounted) return
      if ((dRes as any).data) setDriver((dRes as any).data as DriverDetail)
      if (tRes.data) setTrips(tRes.data as Trip[])
      setLoading(false)
    }

    load(id)
    return () => { mounted = false }
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" label="Loading driver…" />
    </div>
  )

  if (!driver) return (
    <div className="text-center py-24 text-content-secondary">Driver not found.</div>
  )

  const daysToExpiry = differenceInDays(parseISO(driver.license_expiry), new Date())
  const licenseExpired = daysToExpiry < 0
  const expiringSoon = daysToExpiry >= 0 && daysToExpiry <= 30

  const scoreColor = driver.safety_score >= 80 ? 'text-status-available'
    : driver.safety_score >= 60 ? 'text-status-in-shop'
    : 'text-status-retired'

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-bg">
            <User className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-heading-1 text-content-primary">{driver.name}</h2>
              <Badge status={driver.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-caption text-content-secondary">
              <span>License: <strong className="font-mono text-content-primary">{driver.license_number}</strong></span>
              <span>Category: <strong className="text-content-primary">{driver.license_category}</strong></span>
              <span>Region: <strong className="text-content-primary">{driver.region ?? '—'}</strong></span>
              <span>
                Expiry:{' '}
                <strong className={licenseExpired ? 'text-status-retired' : expiringSoon ? 'text-status-in-shop' : 'text-content-primary'}>
                  {format(parseISO(driver.license_expiry), 'dd MMM yyyy')}
                  {licenseExpired && ' (Expired)'}
                  {expiringSoon && !licenseExpired && ` (${daysToExpiry}d left)`}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-accent" />
            <p className="text-caption font-medium text-content-secondary uppercase tracking-wide">Safety Score</p>
          </div>
          <p className={`text-3xl font-bold ${scoreColor}`}>{driver.safety_score}<span className="text-lg font-normal text-content-secondary">/100</span></p>
          <div className="mt-2 h-2 rounded-full bg-surface-bg overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                driver.safety_score >= 80 ? 'bg-status-available' : driver.safety_score >= 60 ? 'bg-status-in-shop' : 'bg-status-retired'
              }`}
              style={{ width: `${driver.safety_score}%` }}
            />
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-4 h-4 text-primary" />
            <p className="text-caption font-medium text-content-secondary uppercase tracking-wide">Total Trips</p>
          </div>
          <p className="text-3xl font-bold text-content-primary">{trips.length}</p>
        </div>
      </div>

      {/* Trip history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-heading-3 text-content-primary">Recent Trips</h3>
        </div>
        {trips.length === 0 ? (
          <p className="px-5 py-8 text-center text-content-secondary">No trips yet.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {trips.map(t => (
              <div key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-content-primary truncate">{t.source} → {t.destination}</p>
                  <p className="text-caption text-content-secondary">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>
                </div>
                <Badge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
