import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label?: string
  }
  loading?: boolean
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  loading = false,
}: KPICardProps) {
  const TrendIcon =
    trend === undefined ? null
    : trend.value > 0 ? TrendingUp
    : trend.value < 0 ? TrendingDown
    : Minus

  const trendColor =
    trend === undefined ? ''
    : trend.value > 0 ? 'text-status-available'
    : trend.value < 0 ? 'text-status-retired'
    : 'text-content-secondary'

  if (loading) {
    return (
      <div className="kpi-card">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-32" />
      </div>
    )
  }

  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption font-medium text-content-secondary uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-2xl font-bold text-content-primary">{value}</p>
          {subtitle && <p className="mt-0.5 text-caption text-content-secondary">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-surface-bg group-hover:scale-110 transition-transform duration-200 ${iconColor}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {trend !== undefined && TrendIcon && (
        <div className={`flex items-center gap-1 text-caption font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" aria-hidden="true" />
          <span>
            {trend.value > 0 ? '+' : ''}{trend.value}%
            {trend.label && <span className="text-content-secondary font-normal ml-1">{trend.label}</span>}
          </span>
        </div>
      )}
    </div>
  )
}
