import { useEffect, useState, useMemo } from 'react'
import { BarChart3, Download, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Papa from 'papaparse'

interface VehicleROI {
  registration_number: string
  name_model: string
  acquisition_cost: number
  total_revenue: number
  total_operational_cost: number
  roi: number
}

interface MonthlyData {
  month: string
  fuel_cost: number
  maintenance_cost: number
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [roiData, setRoiData] = useState<VehicleROI[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)

      // Fetch ROI view
      const { data: roi } = await supabase.from('vehicle_roi').select('*')
      
      // Fetch raw logs for monthly aggregation
      const [fuelRes, maintRes] = await Promise.all([
        supabase.from('fuel_logs').select('cost, log_date'),
        supabase.from('maintenance_logs').select('cost, created_at'),
      ])

      if (!mounted) return

      if (roi) {
        setRoiData(roi as VehicleROI[])
      }

      // Aggregate monthly costs
      const mData: Record<string, MonthlyData> = {}
      
      const addToMonth = (dateStr: string, type: 'fuel_cost' | 'maintenance_cost', cost: number) => {
        const d = new Date(dateStr)
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!mData[m]) {
          mData[m] = { month: m, fuel_cost: 0, maintenance_cost: 0 }
        }
        mData[m][type] += cost
      }

      if (fuelRes.data) {
        fuelRes.data.forEach(f => addToMonth(f.log_date, 'fuel_cost', Number(f.cost)))
      }
      if (maintRes.data) {
        maintRes.data.forEach(m => addToMonth(m.created_at, 'maintenance_cost', Number(m.cost)))
      }

      // Sort months chronologically
      const sortedMonths = Object.values(mData).sort((a, b) => a.month.localeCompare(b.month))
      setMonthlyData(sortedMonths)
      setLoading(false)
    }

    loadData()
    return () => { mounted = false }
  }, [])

  // Process ROI for chart
  const roiChartData = useMemo(() => {
    return roiData.map(v => ({
      name: v.registration_number,
      ROI: v.roi !== null ? Number(v.roi.toFixed(2)) : 0,
    })).sort((a, b) => b.ROI - a.ROI).slice(0, 10) // Top 10 by ROI
  }, [roiData])

  const handleExportCSV = () => {
    setExporting(true)
    try {
      const csv = Papa.unparse(roiData.map(v => ({
        'Registration Number': v.registration_number,
        'Vehicle Model': v.name_model,
        'Acquisition Cost (₹)': v.acquisition_cost,
        'Total Revenue (₹)': v.total_revenue,
        'Total Operational Cost (₹)': v.total_operational_cost,
        'ROI (%)': v.roi !== null ? (v.roi * 100).toFixed(2) : '0.00',
      })))

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transitops-roi-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Generating reports…" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-heading-1 text-content-primary">Reports & Analytics</h2>
          <p className="text-body text-content-secondary mt-0.5">
            Financial and operational performance
          </p>
        </div>
        <button className="btn-secondary" onClick={handleExportCSV} disabled={exporting}>
          <Download className="w-4 h-4" />
          Export ROI CSV
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Operational Costs Trend */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-heading-3 text-content-primary">Monthly Operational Costs</h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-content-secondary">No cost data available</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={val => `₹${val/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="fuel_cost" name="Fuel" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="maintenance_cost" name="Maintenance" stroke="#D97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ROI Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h3 className="text-heading-3 text-content-primary">Top 10 Vehicles by ROI</h3>
          </div>
          {roiChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-content-secondary">No ROI data available</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={val => `${(val * 100).toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                  />
                  <Bar dataKey="ROI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ROI Data Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-heading-3 text-content-primary">Vehicle ROI Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Vehicle</th>
                <th>Acquisition Cost</th>
                <th>Total Revenue</th>
                <th>Operational Cost</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-content-secondary">No vehicle financial data</td>
                </tr>
              ) : (
                roiData.map(row => (
                  <tr key={row.registration_number}>
                    <td className="font-mono font-medium">{row.registration_number}</td>
                    <td>{row.name_model}</td>
                    <td>₹{Number(row.acquisition_cost).toLocaleString()}</td>
                    <td className="text-status-available font-medium">₹{Number(row.total_revenue).toLocaleString()}</td>
                    <td className="text-status-in-shop font-medium">₹{Number(row.total_operational_cost).toLocaleString()}</td>
                    <td className="font-bold">
                      {row.roi !== null ? (
                        <span className={row.roi >= 0 ? 'text-status-available' : 'text-status-retired'}>
                          {(row.roi * 100).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-content-secondary">0.00%</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
