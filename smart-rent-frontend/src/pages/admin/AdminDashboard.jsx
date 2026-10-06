import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {Users, CheckCircle, ArrowRight, Shield,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MotionFadeUp from '../../components/ui/MotionFadeUp'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [usersResult, pendingResult] = await Promise.allSettled([
          api.get('/api/users'),
          api.get('/api/verification/pending'),
        ])

        if (usersResult.status === 'fulfilled') {
          setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : [])
        }

        if (pendingResult.status === 'fulfilled') {
          setPending(
            Array.isArray(pendingResult.value.data) ? pendingResult.value.data : []
          )
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
        <div className="min-h-[60vh] flex items-center
                      justify-center">
          <LoadingSpinner size="lg" />
        </div>
    )
  }

  const stats = [
    {
      label: 'Total users',
      value: users.length,
      hint: 'All registered accounts',
      icon: Users,
      variant: 'info',
    },
    {
      label: 'Pending verifications',
      value: pending.length,
      hint: pending.length
          ? 'Landlord applications waiting'
          : 'All caught up',
      icon: CheckCircle,
      variant: 'warning',
    },
  ]

  return (
      <div className="page-container">

        <div className="mb-10">
          <span className="eyebrow">Admin</span>
          <h1 className="mt-3 text-3xl font-bold
                     text-gray-900 tracking-tight">
            Admin dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Welcome, {user?.firstName}. Platform overview at a glance.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {stats.map(({ label, value, hint, icon: Icon,
                       variant }, i) => (
              <MotionFadeUp key={label} delay={i * 0.05}>
                <div className="stat-tile">
                  <div className="flex items-center justify-between">
                    <span className="stat-tile-label">{label}</span>
                    <div className={`stat-tile-icon ${variant}`}>
                      <Icon className="h-5 w-5"/>
                    </div>
                  </div>
                  <span className="stat-tile-value">{value}</span>
                  <span className="stat-tile-hint">{hint}</span>
                </div>
              </MotionFadeUp>
          ))}
        </div>

        {/* Pending verifications alert */}
        {pending.length > 0 && (
            <div className="alert-warning mb-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">
                    {pending.length} verification
                    {pending.length > 1 ? 's' : ''} pending
                  </h3>
                  <p className="text-meta mt-1">
                    Landlord applications waiting for review.
                  </p>
                </div>
                <Button
                    onClick={() =>
                        navigate('/admin/verification')
                    }
                    className="flex-shrink-0"
                >
                  Review now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2
                      gap-4">
          <button
              onClick={() =>
                  navigate('/admin/verification')
              }
              className="card text-left hover:shadow-md
                     transition-shadow
                     border-2 border-dashed
                     border-gray-200
                     hover:border-brand-green group">
            <Shield className="h-7 w-7 text-gray-300
                             group-hover:text-brand-green
                             mb-4 transition-colors" />
            <h3 className="font-semibold text-gray-900 tracking-tight">
              Landlord verification
            </h3>
            <p className="text-meta text-gray-500 mt-1.5">
              Review and approve landlord applications.
            </p>
          </button>

          <button
              className="card text-left opacity-60
                     cursor-not-allowed"
              disabled>
            <Users className="h-7 w-7 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 tracking-tight">
              User management
            </h3>
            <p className="text-meta text-gray-500 mt-1.5">
              Coming soon
            </p>
          </button>
        </div>

      </div>
  )
}
