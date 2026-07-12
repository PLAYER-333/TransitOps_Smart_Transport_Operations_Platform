import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Users, Wrench, Route, Clock,
  Activity, BarChart3, ArrowRight
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { DEMO_VEHICLES, DEMO_TRIPS, DEMO_DRIVERS } from '@/lib/demoData'

interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  inMaintenanceVehicles: number
  activeTrips: number
  pendingTrips: number
  driversOnDuty: number
  fleetUtilization: number
}

interface RecentTrip {
  id: string
  source: string
  destination: string
  status: string
  created_at: string
  vehicles: { registration_number: string; name_model: string } | null
  drivers: { name: string } | null
}

const STATUS_COLORS = {
  Available: '#16A34A',
  'On Trip': '#2563EB',
  'In Shop': '#D97706',
  Retired: '#DC2626',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [vehicleStatusData, setVehicleStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [weeklyTrips, setWeeklyTrips] = useState<{ day: string; trips: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        let allVehicles: any[] = []
        let trips: any[] = []
        let drivers: any[] = []

        if (IS_DEMO_MODE) {
          allVehicles = DEMO_VEHICLES
          trips = DEMO_TRIPS
          drivers = DEMO_DRIVERS
        } else {
          const [tripsRes, driversRes] = await Promise.all([
            supabase.from('trips').select('id, status, source, destination, created_at, vehicle_id, driver_id').order('created_at', { ascending: false }).limit(5),
            supabase.from('drivers').select('id, status'),
          ])
          const { data: vehiclesData } = await supabase
            .from('vehicles')
            .select('id, status, registration_number, name_model')
          allVehicles = vehiclesData ?? []
          trips = tripsRes.data ?? []
          drivers = driversRes.data ?? []
        }

        if (!mounted) return

        // Compute stats
        const vehicles = allVehicles ?? []

        const available = vehicles.filter((v: any) => v.status === 'Available').length
        const inMaintenance = vehicles.filter((v: any) => v.status === 'In Shop').length
        const onTrip = vehicles.filter((v: any) => v.status === 'On Trip').length
        const retired = vehicles.filter((v: any) => v.status === 'Retired').length

        const activeTrips = trips.filter((t: any) => t.status === 'Dispatched').length
        const pendingTrips = trips.filter((t: any) => t.status === 'Draft').length
        const driversOnDuty = drivers.filter((d: any) => d.status === 'On Trip').length

        const totalActive = vehicles.length - retired
        const utilization = totalActive > 0 ? Math.round((onTrip / totalActive) * 100) : 0

        setStats({
          totalVehicles: vehicles.length,
          availableVehicles: available,
          inMaintenanceVehicles: inMaintenance,
          activeTrips,
          pendingTrips,
          driversOnDuty,
          fleetUtilization: utilization,
        })

        // Pie chart data
        setVehicleStatusData([
          { name: 'Available', value: available, color: STATUS_COLORS.Available },
          { name: 'On Trip', value: onTrip, color: STATUS_COLORS['On Trip'] },
          { name: 'In Shop', value: inMaintenance, color: STATUS_COLORS['In Shop'] },
          { name: 'Retired', value: retired, color: STATUS_COLORS.Retired },
        ].filter(d => d.value > 0))

        // Weekly trip trend (simple mock from real data bucketing)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const weekData = days.map((day, i) => ({
          day,
          trips: trips.filter((t: any) => {
            const d = new Date(t.created_at)
            return d.getDay() === (i + 1) % 7
          }).length,
        }))
        setWeeklyTrips(weekData)

        // Recent trips with vehicle + driver name
        if (IS_DEMO_MODE) {
          if (mounted) setRecentTrips(trips.slice(0, 5) as RecentTrip[])
        } else if (trips.length > 0) {
          const tripIds = trips.map((t: any) => t.id)
          const { data: fullTrips } = await supabase
            .from('trips')
            .select('id, source, destination, status, created_at, vehicles(registration_number, name_model), drivers(name)')
            .in('id', tripIds)
            .order('created_at', { ascending: false })

          if (mounted) setRecentTrips((fullTrips ?? []) as RecentTrip[])
        }
      } catch {
        // Error loading dashboard — generic, no details to client
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-1 text-content-primary">Fleet Overview</h2>
          <p className="text-body text-content-secondary mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface-bg rounded-xl border border-surface-border">
          <Activity className="w-4 h-4 text-status-available" />
          <span className="text-caption font-medium text-content-secondary">Live</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <KPICard
          title="Total Vehicles"
          value={stats?.totalVehicles ?? 0}
          icon={Truck}
          iconColor="text-primary"
          loading={loading}
        />
        <KPICard
          title="Available"
          value={stats?.availableVehicles ?? 0}
          icon={Truck}
          iconColor="text-status-available"
          loading={loading}
        />
        <KPICard
          title="In Maintenance"
          value={stats?.inMaintenanceVehicles ?? 0}
          icon={Wrench}
          iconColor="text-status-in-shop"
          loading={loading}
        />
        <KPICard
          title="Active Trips"
          value={stats?.activeTrips ?? 0}
          icon={Route}
          iconColor="text-status-on-trip"
          loading={loading}
        />
        <KPICard
          title="Pending Trips"
          value={stats?.pendingTrips ?? 0}
          icon={Clock}
          iconColor="text-status-draft"
          loading={loading}
        />
        <KPICard
          title="Drivers On Duty"
          value={stats?.driversOnDuty ?? 0}
          icon={Users}
          iconColor="text-accent"
          loading={loading}
        />
        <KPICard
          title="Utilization"
          value={loading ? '—' : `${stats?.fleetUtilization ?? 0}%`}
          subtitle="Active fleet"
          icon={BarChart3}
          iconColor="text-primary-light"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle status donut */}
        <div className="card p-5">
          <h3 className="text-heading-3 text-content-primary mb-4">Fleet Status</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : vehicleStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-content-secondary text-body">
              No vehicle data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly trip trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-heading-3 text-content-primary mb-4">Weekly Trips</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrips} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                />
                <Bar dataKey="trips" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent trips */}
      {(user?.role === 'fleet_manager' || user?.role === 'safety_officer') && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h3 className="text-heading-3 text-content-primary">Recent Trips</h3>
            <Link to="/trips" className="flex items-center gap-1 text-caption text-primary-light hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-surface-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-4 flex-1" />
                  <div className="skeleton h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recentTrips.length === 0 ? (
            <div className="py-10 text-center text-content-secondary text-body">No trips yet</div>
          ) : (
            <div className="divide-y divide-surface-border">
              {recentTrips.map(trip => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-bg transition-colors duration-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-content-primary truncate">
                      {trip.source} → {trip.destination}
                    </p>
                    <p className="text-caption text-content-secondary mt-0.5">
                      {trip.vehicles?.registration_number} · {trip.drivers?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge status={trip.status} />
                    <span className="text-caption text-content-secondary hidden sm:block">
                      {format(new Date(trip.created_at), 'MMM d')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-content-secondary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
