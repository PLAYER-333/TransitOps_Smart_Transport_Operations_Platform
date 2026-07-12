import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { DEMO_VEHICLES } from '@/lib/demoData'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { VehicleForm } from './VehicleForm'

type Vehicle = {
  id: string
  registration_number: string
  name_model: string
  type: string
  max_load_capacity: number
  odometer: number
  acquisition_cost: number
  region: string | null
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
  created_at: string
}

export default function VehicleList() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const canEdit = user?.role === 'fleet_manager'

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    if (IS_DEMO_MODE) {
      let data = DEMO_VEHICLES as unknown as Vehicle[]
      if (statusFilter !== 'all') data = data.filter(v => v.status === statusFilter)
      if (typeFilter !== 'all') data = data.filter(v => v.type === typeFilter)
      setVehicles(data)
      setLoading(false)
      return
    }
    let q = supabase
      .from('vehicles')
      .select('id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status, created_at')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)

    const { data, error: err } = await q
    if (!err && data) setVehicles(data as Vehicle[])
    setLoading(false)
  }, [statusFilter, typeFilter])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const { error: err } = await supabase.from('vehicles').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    if (err) {
      setError('Unable to delete vehicle. It may have active trips or maintenance records.')
    } else {
      setDeleteTarget(null)
      fetchVehicles()
    }
  }

  const uniqueTypes = [...new Set(vehicles.map(v => v.type))].sort()

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'registration_number',
      header: 'Registration',
      sortable: true,
      render: (row) => (
        <span className="font-medium font-mono text-content-primary">
          {String(row.registration_number)}
        </span>
      ),
    },
    {
      key: 'name_model',
      header: 'Vehicle',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-content-primary">{String(row.name_model)}</p>
          <p className="text-caption text-content-secondary">{String(row.type)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={String(row.status)} />,
    },
    {
      key: 'max_load_capacity',
      header: 'Capacity (kg)',
      sortable: true,
      render: (row) => <span>{Number(row.max_load_capacity).toLocaleString()}</span>,
    },
    {
      key: 'odometer',
      header: 'Odometer (km)',
      sortable: true,
      render: (row) => <span>{Number(row.odometer).toLocaleString()}</span>,
    },
    {
      key: 'region',
      header: 'Region',
      render: (row) => <span className="text-content-secondary">{String(row.region ?? '—')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Vehicle Registry</h2>
          <p className="text-body text-content-secondary mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet
          </p>
        </div>
        {canEdit && (
          <button
            id="add-vehicle-button"
            className="btn-primary"
            onClick={() => { setEditTarget(null); setFormOpen(true) }}
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          id="vehicle-status-filter"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <select
          id="vehicle-type-filter"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="form-input w-auto"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-sm">Dismiss</button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns as Column<Record<string, unknown>>[]}
        data={vehicles as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        searchPlaceholder="Search vehicles…"
        searchKeys={['registration_number', 'name_model', 'type', 'region'] as (keyof Record<string, unknown>)[]}
        emptyMessage="No vehicles found."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Link to={`/vehicles/${row.id as string}`} className="btn-icon" title="View details">
              <Eye className="w-4 h-4" />
            </Link>
            {canEdit && (
              <>
                <button
                  className="btn-icon"
                  title="Edit vehicle"
                  onClick={() => {
                    setEditTarget(row as unknown as Vehicle)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete vehicle"
                  onClick={() => setDeleteTarget(row as unknown as Vehicle)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Create / Edit modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        title={editTarget ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
      >
        <VehicleForm
          vehicle={editTarget}
          onSuccess={() => { setFormOpen(false); setEditTarget(null); fetchVehicles() }}
          onCancel={() => { setFormOpen(false); setEditTarget(null) }}
        />
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={deleteLoading}
              id="confirm-delete-vehicle"
            >
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-body text-content-secondary">
          Are you sure you want to delete <span className="font-medium text-content-primary">{deleteTarget?.registration_number}</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
