import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function Forbidden() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="p-5 rounded-full bg-red-50">
            <ShieldX className="w-12 h-12 text-red-500" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-display text-content-primary mb-2">403</h1>
        <h2 className="text-heading-2 text-content-primary mb-3">Access Denied</h2>
        <p className="text-body text-content-secondary mb-6">
          You don't have permission to view this page. Contact your Fleet Manager if you believe this is an error.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          id="forbidden-back-button"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Go back
        </button>
      </div>
    </div>
  )
}
