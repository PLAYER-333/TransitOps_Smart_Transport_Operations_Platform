import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DriverForm } from './DriverForm'
import { differenceInDays, parseISO, format } from 'date-fns'

type Driver = {
  id: string
  name: string
  license_number: string
  license_category: string
  license_expiry: string
  safety_score: number
  region: string | null
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
  created_at: string
}

function LicenseExpiryCell({ expiry }: { expiry: string }) {
  const days = differenceInDays(parseISO(expiry), new Date())
  const expired = days < 0
  const expiringSoon = days >= 0 && days <= 30
  return (
    <div className="flex items-center gap-1.5">
      {(expired || expiringSoon) && (
        <AlertTriangle
          className={`w-3.5 h-3.5 ${expired ? 'text-status-retired' : 'text-status-in-shop'}`}
          aria-label={expired ? 'License expired' : 'Expiring soon'}
        />
      )}
      <span className={expired ? 'text-status-retired font-medium' : expiringSoon ? 'text-status-in-shop font-medium' : 'text-content-primary'}>
        {format(parseISO(expiry), 'dd MMM yyyy')}
      </span>
      {expiringSoon && !expired && (
        <span className="text-xs text-status-in-shop">({days}d)</span>
      )}
      {expired && (
        <span className="text-xs text-status-retired">(Expired)</span>
      )}
    </div>
  )
}

export default function DriverList() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Driver | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const canEdit = user?.role === 'fleet_manager' || user?.role === 'safety_officer'
  const canDelete = user?.role === 'fleet_manager'
  // Drivers can see their own row — server RLS enforces this
  const isDriver = user?.role === 'driver'

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    // Select only needed fields — avoid dumping PII unnecessarily
    let q = supabase
      .from('drivers')
      .select('id, name, license_number, license_category, license_expiry, safety_score, region, status, created_at')
      .order('name')

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)

    const { data, error: err } = await q
    if (!err && data) setDrivers(data as Driver[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const { error: err } = await supabase.from('drivers').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    if (err) {
      setError('Unable to delete driver. They may have active trips.')
    } else {
      setDeleteTarget(null)
      fetchDrivers()
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <Link to={`/drivers/${row.id as string}`} className="font-medium text-content-primary hover:text-primary-light hover:underline">
          {String(row.name)}
        </Link>
      ),
    },
    {
      key: 'license_category',
      header: 'License',
      render: (row) => (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary">
            {String(row.license_category)}
          </span>
        </div>
      ),
    },
    {
      key: 'license_expiry',
      header: 'Expiry',
      sortable: true,
      render: (row) => <LicenseExpiryCell expiry={String(row.license_expiry)} />,
    },
    {
      key: 'safety_score',
      header: 'Safety Score',
      sortable: true,
      render: (row) => {
        const score = Number(row.safety_score)
        const color = score >= 80 ? 'text-status-available' : score >= 60 ? 'text-status-in-shop' : 'text-status-retired'
        return <span className={`font-medium ${color}`}>{score}/100</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={String(row.status)} />,
    },
    {
      key: 'region',
      header: 'Region',
      render: (row) => <span className="text-content-secondary">{String(row.region ?? '—')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Driver Management</h2>
          <p className="text-body text-content-secondary mt-0.5">
            {drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        {canEdit && (
          <button
            id="add-driver-button"
            className="btn-primary"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          id="driver-status-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="Off Duty">Off Duty</option>
          <option value="Suspended">Suspended</option>
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
        data={drivers as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        searchPlaceholder="Search drivers…"
        searchKeys={['name', 'license_category', 'region'] as (keyof Record<string, unknown>)[]}
        emptyMessage="No drivers found."
        actions={isDriver ? undefined : (row) => (
          <div className="flex items-center gap-1">
            <Link to={`/drivers/${row.id as string}`} className="btn-icon" title="View details">
              <Eye className="w-4 h-4" />
            </Link>
            {canEdit && (
              <button
                className="btn-icon"
                title="Edit driver"
                onClick={() => { setEditTarget(row as unknown as Driver); setFormOpen(true) }}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                title="Delete driver"
                onClick={() => setDeleteTarget(row as unknown as Driver)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />

      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        title={editTarget ? 'Edit Driver' : 'Add Driver'}
        size="lg"
      >
        <DriverForm
          driver={editTarget}
          onSuccess={() => { setFormOpen(false); setEditTarget(null); fetchDrivers() }}
          onCancel={() => { setFormOpen(false); setEditTarget(null) }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Driver"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={deleteLoading}
              id="confirm-delete-driver"
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-body text-content-secondary">
          Are you sure you want to remove <span className="font-medium text-content-primary">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
