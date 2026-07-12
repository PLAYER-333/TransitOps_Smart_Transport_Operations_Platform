import { useEffect, useState, type FormEvent } from 'react'
import { Plus, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { format } from 'date-fns'

interface AppUser {
  id: string
  user_id: string
  role: string
  region: string | null
  created_at: string
}

const ROLES = [
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'driver', label: 'Driver' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'financial_analyst', label: 'Financial Analyst' },
]

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    role: 'driver',
    region: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setUsers(data as AppUser[])
    setLoading(false)
  }

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setInviteLoading(true)

    // Call Supabase Edge Function to create auth user and insert into user_roles
    const { data, error: err } = await supabase.functions.invoke('invite-user', {
      body: { 
        email: form.email, 
        role: form.role, 
        region: form.region || null 
      }
    })

    setInviteLoading(false)

    if (err || (data && data.error)) {
      setError(err?.message || data?.error || 'Failed to invite user')
    } else {
      setSuccess(`Invitation sent to ${form.email}`)
      setForm({ email: '', role: 'driver', region: '' })
      setFormOpen(false)
      fetchUsers()
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'user_id',
      header: 'User ID (Auth ID)',
      render: (row) => <span className="font-mono text-xs text-content-secondary truncate max-w-[200px] block">{String(row.user_id)}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => {
        const roleStr = String(row.role)
        const label = ROLES.find(r => r.value === roleStr)?.label || roleStr
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${roleStr === 'fleet_manager' ? 'bg-primary/10 text-primary' 
            : roleStr === 'safety_officer' ? 'bg-amber-100 text-amber-800'
            : roleStr === 'financial_analyst' ? 'bg-purple-100 text-purple-800'
            : 'bg-surface-bg border border-surface-border text-content-primary'}`}>
            {label}
          </span>
        )
      },
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      render: (row) => <span className="text-content-primary">{row.region ? String(row.region) : 'All Regions'}</span>,
    },
    {
      key: 'created_at',
      header: 'Created On',
      sortable: true,
      render: (row) => <span className="text-content-secondary text-sm">{format(new Date(String(row.created_at)), 'dd MMM yyyy, HH:mm')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">User Management</h2>
          <p className="text-body text-content-secondary mt-0.5">
            Manage roles and access (Fleet Manager only)
          </p>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {success && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-body flex justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="underline text-sm">Dismiss</button>
        </div>
      )}

      {/* Note about Edge Function */}
      <div className="px-5 py-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 text-blue-800">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
        <div className="text-sm">
          <p className="font-medium mb-1">Strict Access Control</p>
          <p className="text-blue-700/80">
            For security, self-signup is disabled. New users must be invited by a Fleet Manager. 
            The invite process uses a secure Edge Function with the service role key to provision the user in Supabase Auth and assign their role in the database.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns as Column<Record<string, unknown>>[]}
          data={users as unknown as Record<string, unknown>[]}
          keyField="id"
          loading={loading}
          emptyMessage="No users found."
        />
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Invite New User"
        size="md"
      >
        <form onSubmit={handleInvite} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-body">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="uf-email" className="form-label">Email Address *</label>
            <input
              id="uf-email"
              type="email"
              required
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@company.com"
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="uf-role" className="form-label">Role *</label>
            <select
              id="uf-role"
              required
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              className="form-input"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="uf-region" className="form-label">Region (Optional)</label>
            <input
              id="uf-region"
              type="text"
              value={form.region}
              onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
              placeholder="e.g. North, South"
              className="form-input"
            />
            <p className="text-xs text-content-secondary mt-1">If set, limits Driver/Safety Officer access to this region.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button
              type="submit"
              disabled={inviteLoading || !form.email}
              className="btn-primary"
            >
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
