import { useEffect, useState, useCallback } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { MaintenanceForm } from './MaintenanceForm'
import { format } from 'date-fns'

interface MaintenanceLog {
  id: string
  vehicle_id: string
  description: string
  cost: number
  is_active: boolean
  created_at: string
  closed_at: string | null
  vehicles: { registration_number: string; name_model: string } | null
}

export default function MaintenanceList() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [closeTarget, setCloseTarget] = useState<MaintenanceLog | null>(null)
  const [closeLoading, setCloseLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only fleet managers can manage maintenance in this app
  const canEdit = user?.role === 'fleet_manager'

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('maintenance_logs')
      .select('id, vehicle_id, description, cost, is_active, created_at, closed_at, vehicles(registration_number, name_model)')
      .order('created_at', { ascending: false })

    if (statusFilter === 'active') q = q.eq('is_active', true)
    if (statusFilter === 'closed') q = q.eq('is_active', false)

    const { data, error: err } = await q
    if (!err && data) setLogs(data as unknown as MaintenanceLog[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleCloseMaintenance = async () => {
    if (!closeTarget) return
    setCloseLoading(true)
    setError(null)
    
    // The DB trigger `on_maintenance_closed` handles resetting the vehicle status
    const { error: err } = await supabase
      .from('maintenance_logs')
      // @ts-ignore
      .update({ is_active: false, closed_at: new Date().toISOString() } as any)
      .eq('id', closeTarget.id)

    setCloseLoading(false)
    if (err) {
      setError(err.message || 'Unable to close maintenance record.')
    } else {
      setCloseTarget(null)
      fetchLogs()
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => {
        const r = row as unknown as MaintenanceLog
        return (
          <div>
            <p className="font-mono font-medium text-content-primary">{r.vehicles?.registration_number}</p>
            <p className="text-caption text-content-secondary truncate">{r.vehicles?.name_model}</p>
          </div>
        )
      }
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span className="text-content-primary truncate max-w-[300px] block">{String(row.description)}</span>,
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      render: (row) => <span className="font-medium text-content-primary">₹{Number(row.cost).toLocaleString()}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => {
        const r = row as unknown as MaintenanceLog
        return <Badge status={r.is_active ? 'Active' : 'Closed'} />
      }
    },
    {
      key: 'created_at',
      header: 'Date Opened',
      sortable: true,
      render: (row) => <span className="text-content-secondary">{format(new Date(String(row.created_at)), 'dd MMM yyyy')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Maintenance</h2>
          <p className="text-body text-content-secondary mt-0.5">
            {logs.filter(l => l.is_active).length} vehicles currently in shop
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Log Maintenance
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input w-auto"
        >
          <option value="all">All Records</option>
          <option value="active">Active (In Shop)</option>
          <option value="closed">Closed (Resolved)</option>
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
        data={logs as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        searchPlaceholder="Search description…"
        searchKeys={['description']}
        emptyMessage="No maintenance records found."
        actions={(row) => {
          const m = row as unknown as MaintenanceLog
          if (!canEdit || !m.is_active) return null
          return (
            <button
              className="btn-secondary py-1.5 px-3 text-xs gap-1.5 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
              onClick={() => setCloseTarget(m)}
              title="Mark as resolved and free the vehicle"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          )
        }}
      />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Log Maintenance Event"
        size="md"
      >
        <MaintenanceForm onSuccess={() => { setFormOpen(false); fetchLogs() }} onCancel={() => setFormOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        title="Resolve Maintenance"
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCloseTarget(null)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleCloseMaintenance}
              disabled={closeLoading}
            >
              {closeLoading ? 'Resolving…' : 'Mark as Resolved'}
            </button>
          </>
        }
      >
        <p className="text-body text-content-secondary">
          Closing this record will mark the vehicle <strong className="text-content-primary">{closeTarget?.vehicles?.registration_number}</strong> as <Badge status="Available" className="inline-flex scale-90 -my-1 mx-1" /> again.
          Are you sure?
        </p>
      </Modal>
    </div>
  )
}
