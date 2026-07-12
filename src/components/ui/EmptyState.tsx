import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-surface-bg text-content-secondary">
          {icon}
        </div>
      )}
      <h3 className="text-heading-3 text-content-primary mb-1">{title}</h3>
      {description && (
        <p className="text-body text-content-secondary max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
