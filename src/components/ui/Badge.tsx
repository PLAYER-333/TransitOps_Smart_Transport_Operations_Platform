type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired'
type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
type MaintenanceStatus = 'Active' | 'Closed'

type BadgeStatus = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus | string

const statusClassMap: Record<string, string> = {
  Available: 'badge-available',
  'On Trip': 'badge-on-trip',
  'In Shop': 'badge-in-shop',
  Retired: 'badge-retired',
  Suspended: 'badge-suspended',
  'Off Duty': 'badge-draft',
  Draft: 'badge-draft',
  Dispatched: 'badge-dispatched',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
  Active: 'badge-in-shop',
  Closed: 'badge-completed',
}

const statusDotMap: Record<string, string> = {
  Available: 'bg-status-available',
  'On Trip': 'bg-status-on-trip',
  'In Shop': 'bg-status-in-shop',
  Retired: 'bg-status-retired',
  Suspended: 'bg-status-suspended',
  'Off Duty': 'bg-status-draft',
  Draft: 'bg-status-draft',
  Dispatched: 'bg-status-on-trip',
  Completed: 'bg-status-available',
  Cancelled: 'bg-status-retired',
  Active: 'bg-status-in-shop',
  Closed: 'bg-status-available',
}

interface BadgeProps {
  status: BadgeStatus
  showDot?: boolean
  className?: string
}

export function Badge({ status, showDot = true, className = '' }: BadgeProps) {
  const badgeClass = statusClassMap[status] ?? 'badge-draft'
  const dotClass = statusDotMap[status] ?? 'bg-status-draft'

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {showDot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      )}
      {status}
    </span>
  )
}
