import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, CheckCircle2, XCircle, Send, Route } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TripForm } from './TripForm'
import { format } from 'date-fns'

type Trip = {
  id: string
  source: string
  destination: string
  vehicle_id: string
  driver_id: string
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
  created_at: string
  vehicles: { registration_number: string; name_model: string } | null
  drivers: { name: string } | null
}

export default function TripList() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionTarget, setActionTarget] = useState<{ trip: Trip; action: 'dispatch' | 'complete' | 'cancel' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fleet Managers can do everything. Drivers can create and update their own trips.
  const canCreate = user?.role === 'fleet_manager' || user?.role === 'driver'

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('trips')
      .select(`
        id, source, destination, status, created_at, vehicle_id, driver_id,
        vehicles(registration_number, name_model),
        drivers(name)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)

    const { data, error: err } = await q
    if (!err && data) setTrips(data as unknown as Trip[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const handleAction = async () => {
    if (!actionTarget) return
    setActionLoading(true)
    setError(null)
    const { trip, action } = actionTarget

    let newStatus = ''
    if (action === 'dispatch') newStatus = 'Dispatched'
    else if (action === 'complete') newStatus = 'Completed'
    else if (action === 'cancel') newStatus = 'Cancelled'

    // Update trip status. The DB triggers (on_trip_dispatched, on_trip_completed, on_trip_cancelled)
    // will automatically handle updating the vehicle and driver statuses!
    const { error: err } = await supabase.from('trips').update({ status: newStatus }).eq('id', trip.id)
    
    setActionLoading(false)
    if (err) {
      setError(err.message || 'Action failed. Check vehicle/driver availability.')
    } else {
      setActionTarget(null)
      fetchTrips()
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (row) => {
        const r = row as unknown as Trip
        return (
          <Link to={`/trips/${r.id}`} className="font-medium text-content-primary hover:text-primary-light hover:underline block truncate max-w-[200px]">
            {r.source} → {r.destination}
          </Link>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => {
        const r = row as unknown as Trip
        return (
          <div>
            <p className="font-mono text-content-primary text-sm">{r.vehicles?.registration_number}</p>
            <p className="text-caption text-content-secondary truncate max-w-[150px]">{r.vehicles?.name_model}</p>
          </div>
        )
      },
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (row) => {
        const r = row as unknown as Trip
        return <span className="text-content-primary">{r.drivers?.name}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={String(row.status)} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => <span className="text-content-secondary text-sm">{format(new Date(String(row.created_at)), 'dd MMM yyyy')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Trip Management</h2>
          <p className="text-body text-content-secondary mt-0.5">
            {trips.length} trip{trips.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-sm">Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={trips as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        searchPlaceholder="Search route or reg number…"
        searchKeys={['source', 'destination']} // We can't search joined fields easily purely client-side without flatting, but source/dest works
        emptyMessage="No trips found."
        actions={(row) => {
          const trip = row as unknown as Trip
          return (
            <div className="flex items-center gap-1">
              <Link to={`/trips/${trip.id}`} className="btn-icon" title="View details">
                <Eye className="w-4 h-4" />
              </Link>
              
              {canCreate && trip.status === 'Draft' && (
                <>
                  <button
                    className="btn-icon text-primary hover:text-primary-light hover:bg-primary/5"
                    title="Dispatch Trip"
                    onClick={() => setActionTarget({ trip, action: 'dispatch' })}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Cancel Trip"
                    onClick={() => setActionTarget({ trip, action: 'cancel' })}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              {canCreate && trip.status === 'Dispatched' && (
                <>
                  <button
                    className="btn-icon text-status-available hover:text-green-600 hover:bg-green-50"
                    title="Complete Trip"
                    onClick={() => setActionTarget({ trip, action: 'complete' })}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Cancel Trip"
                    onClick={() => setActionTarget({ trip, action: 'cancel' })}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )
        }}
      />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Create New Trip"
        size="lg"
      >
        <TripForm
          onSuccess={() => { setFormOpen(false); fetchTrips() }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget?.action === 'dispatch' ? 'Dispatch Trip' :
          actionTarget?.action === 'complete' ? 'Complete Trip' : 'Cancel Trip'
        }
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setActionTarget(null)}>Back</button>
            <button
              className={actionTarget?.action === 'cancel' ? 'btn-danger' : 'btn-primary'}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing…' : 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-body text-content-secondary">
          Are you sure you want to {actionTarget?.action} this trip from <strong>{actionTarget?.trip.source}</strong> to <strong>{actionTarget?.trip.destination}</strong>?
          {actionTarget?.action === 'dispatch' && ' The selected vehicle and driver will be marked as "On Trip".'}
          {actionTarget?.action === 'complete' && ' The vehicle and driver will become "Available" again. You should log fuel and revenue next.'}
          {actionTarget?.action === 'cancel' && ' The vehicle and driver will be freed if they were dispatched.'}
        </p>
      </Modal>
    </div>
  )
}
