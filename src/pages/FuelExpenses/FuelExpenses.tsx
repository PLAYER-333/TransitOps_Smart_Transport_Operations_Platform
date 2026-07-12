import { useEffect, useState, useCallback } from 'react'
import { Fuel, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { FuelLogForm } from './FuelLogForm'
import { ExpenseForm } from './ExpenseForm'
import { format } from 'date-fns'

interface FuelLog {
  id: string
  liters: number
  cost: number
  log_date: string
  vehicles: { registration_number: string; name_model: string } | null
}

interface Expense {
  id: string
  category: string
  amount: number
  expense_date: string
  note: string | null
  vehicles: { registration_number: string; name_model: string } | null
}

export default function FuelExpenses() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel')
  
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  
  const [fuelFormOpen, setFuelFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)

  // Financial Analyst is read-only.
  const canEdit = user?.role === 'fleet_manager' || user?.role === 'driver'

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (activeTab === 'fuel') {
      const { data } = await supabase
        .from('fuel_logs')
        .select('id, liters, cost, log_date, vehicles(registration_number, name_model)')
        .order('log_date', { ascending: false })
      if (data) setFuelLogs(data as unknown as FuelLog[])
    } else {
      const { data } = await supabase
        .from('expenses')
        .select('id, category, amount, expense_date, note, vehicles(registration_number, name_model)')
        .order('expense_date', { ascending: false })
      if (data) setExpenses(data as unknown as Expense[])
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => { fetchData() }, [fetchData])

  const fuelColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => {
        const r = row as unknown as FuelLog
        return (
          <div>
            <p className="font-mono font-medium text-content-primary">{r.vehicles?.registration_number}</p>
            <p className="text-caption text-content-secondary truncate">{r.vehicles?.name_model}</p>
          </div>
        )
      }
    },
    {
      key: 'liters',
      header: 'Volume',
      sortable: true,
      render: (row) => <span className="font-medium text-content-primary">{Number(row.liters).toFixed(1)} L</span>,
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      render: (row) => <span className="text-content-primary">₹{Number(row.cost).toLocaleString()}</span>,
    },
    {
      key: 'log_date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="text-content-secondary">{format(new Date(String(row.log_date)), 'dd MMM yyyy')}</span>,
    },
  ]

  const expenseColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => {
        const r = row as unknown as Expense
        return (
          <div>
            <p className="font-mono font-medium text-content-primary">{r.vehicles?.registration_number}</p>
            <p className="text-caption text-content-secondary truncate">{r.vehicles?.name_model}</p>
          </div>
        )
      }
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-content-primary">{String(row.category)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-medium text-content-primary">₹{Number(row.amount).toLocaleString()}</span>,
    },
    {
      key: 'note',
      header: 'Note',
      render: (row) => <span className="text-content-secondary text-sm truncate max-w-[200px] block">{row.note ? String(row.note) : '—'}</span>,
    },
    {
      key: 'expense_date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="text-content-secondary">{format(new Date(String(row.expense_date)), 'dd MMM yyyy')}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Fuel & Expenses</h2>
          <p className="text-body text-content-secondary mt-0.5">
            Track fuel logs and operational expenses
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setExpenseFormOpen(true)}>
              <IndianRupee className="w-4 h-4" />
              Log Expense
            </button>
            <button className="btn-primary" onClick={() => setFuelFormOpen(true)}>
              <Fuel className="w-4 h-4" />
              Log Fuel
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        <button
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 ${
            activeTab === 'fuel' ? 'border-primary text-primary' : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
          onClick={() => setActiveTab('fuel')}
        >
          Fuel Logs
        </button>
        <button
          className={`px-4 py-3 text-body font-medium transition-colors border-b-2 ${
            activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
          onClick={() => setActiveTab('expenses')}
        >
          Other Expenses
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'fuel' ? (
          <DataTable
            columns={fuelColumns as Column<Record<string, unknown>>[]}
            data={fuelLogs as unknown as Record<string, unknown>[]}
            keyField="id"
            loading={loading}
            emptyMessage="No fuel logs found."
          />
        ) : (
          <DataTable
            columns={expenseColumns as Column<Record<string, unknown>>[]}
            data={expenses as unknown as Record<string, unknown>[]}
            keyField="id"
            loading={loading}
            emptyMessage="No expenses found."
          />
        )}
      </div>

      <Modal
        isOpen={fuelFormOpen}
        onClose={() => setFuelFormOpen(false)}
        title="Log Fuel"
        size="md"
      >
        <FuelLogForm onSuccess={() => { setFuelFormOpen(false); if (activeTab === 'fuel') fetchData(); }} onCancel={() => setFuelFormOpen(false)} />
      </Modal>

      <Modal
        isOpen={expenseFormOpen}
        onClose={() => setExpenseFormOpen(false)}
        title="Log Expense"
        size="md"
      >
        <ExpenseForm onSuccess={() => { setExpenseFormOpen(false); if (activeTab === 'expenses') fetchData(); }} onCancel={() => setExpenseFormOpen(false)} />
      </Modal>
    </div>
  )
}
