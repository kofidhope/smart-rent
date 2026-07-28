import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {Users, CheckCircle, ArrowRight, Shield,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import api, { getErrorMessage } from '../../services/api'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, pendingRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/verification/pending'),
        ])
        setUsers(usersRes.data)
        setPending(pendingRes.data)
      } catch {
        // Fail silently
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

  return (
      <div className="page-container">

        <h1 className="text-2xl font-bold
                     text-gray-900 mb-2">
          Admin dashboard
        </h1>
        <p className="text-gray-500 mb-8">
          Welcome, {user?.firstName}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card">
            <div className="inline-flex items-center
                          justify-center w-10 h-10
                          bg-blue-50 rounded-lg mb-3">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {users.length}
            </p>
            <p className="text-sm text-gray-500">
              Total users
            </p>
          </div>

          <div className="card">
            <div className="inline-flex items-center
                          justify-center w-10 h-10
                          bg-yellow-50 rounded-lg mb-3">
              <CheckCircle className="h-5 w-5
                                    text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {pending.length}
            </p>
            <p className="text-sm text-gray-500">
              Pending verifications
            </p>
          </div>
        </div>

        {/* Pending verifications alert */}
        {pending.length > 0 && (
            <div className="card bg-yellow-50
                        border-yellow-200 mb-6">
              <div className="flex items-center
                          justify-between">
                <div>
                  <h3 className="font-semibold
                             text-yellow-800">
                    {pending.length} verification
                    {pending.length > 1 ? 's' : ''} pending
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Landlord applications waiting for review
                  </p>
                </div>
                <Button
                    onClick={() =>
                        navigate('/admin/verification')
                    }
                    className="bg-yellow-500 hover:bg-yellow-600
                         text-white focus:ring-yellow-400
                         flex-shrink-0"
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
                     hover:border-brand-green group"
          >
            <Shield className="h-8 w-8 text-gray-300
                             group-hover:text-brand-green
                             mb-3 transition-colors" />
            <h3 className="font-semibold text-gray-900">
              Landlord verification
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve landlord applications
            </p>
          </button>

          <button
              className="card text-left opacity-60
                     cursor-not-allowed"
              disabled
          >
            <Users className="h-8 w-8 text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900">
              User management
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Coming soon
            </p>
          </button>
        </div>

      </div>
  )
}