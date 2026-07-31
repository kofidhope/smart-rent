import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {Building2, TrendingUp, Plus, ArrowRight,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import PropertyService from '../../services/property.service'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function LandlordDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [revenue, setRevenue] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [props, rev, total] = await Promise.all([
          PropertyService.getMyProperties(),
          PaymentService.getOwnerRevenue(),
          PaymentService.getOwnerTotalRevenue(),
        ])
        setProperties(props)
        setRevenue(rev)
        setTotalRevenue(total)
      } catch {
        // Fail silently
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const availableCount = properties.filter(
      p => p.status === 'AVAILABLE'
  ).length

  const rentedCount = properties.filter(
      p => p.status === 'RENTED'
  ).length

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

        <div className="flex items-center
                      justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold
                         text-gray-900">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-gray-500 mt-1">
              Landlord dashboard
            </p>
          </div>
          <Button
              onClick={() =>
                  navigate('/landlord/properties/new')
              }
          >
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4
                      gap-4 mb-8">
          {[
            {
              label: 'Total properties',
              value: properties.length,
              icon: Building2,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              label: 'Available',
              value: availableCount,
              icon: Building2,
              color: 'text-green-600 bg-green-50',
            },
            {
              label: 'Rented out',
              value: rentedCount,
              icon: Building2,
              color: 'text-purple-600 bg-purple-50',
            },
            {
              label: 'Total revenue',
              value: `GHS ${Number(totalRevenue)
                  .toLocaleString()}`,
              icon: TrendingUp,
              color: 'text-brand-green bg-brand-light',
            },
          ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card">
                <div className={`
              inline-flex items-center justify-center
              w-10 h-10 rounded-lg mb-3 ${color}
            `}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold
                          text-gray-900 truncate">
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {label}
                </p>
              </div>
          ))}
        </div>

        {/* Properties overview */}
        <div className="card mb-6">
          <div className="flex items-center
                        justify-between mb-4">
            <h2 className="section-title mb-0">
              My properties
            </h2>
            <button
                onClick={() =>
                    navigate('/landlord/properties')
                }
                className="text-sm text-brand-green
                       hover:text-brand-dark
                       flex items-center gap-1
                       font-medium"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {properties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12
                                   text-gray-200
                                   mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  No properties yet
                </p>
                <Button
                    onClick={() =>
                        navigate('/landlord/properties/new')
                    }
                >
                  <Plus className="h-4 w-4" />
                  Add your first property
                </Button>
              </div>
          ) : (
              <div className="space-y-3">
                {properties.slice(0, 4).map(property => (
                    <div
                        key={property.id}
                        className="flex items-center
                           justify-between p-3
                           rounded-lg bg-gray-50
                           hover:bg-gray-100
                           transition-colors cursor-pointer"
                        onClick={() =>
                            navigate('/landlord/properties')
                        }
                    >
                      <div>
                        <p className="text-sm font-medium
                                text-gray-900">
                          {property.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {property.city} ·{' '}
                          GHS {property.price.toLocaleString()}
                          /month
                        </p>
                      </div>
                      <Badge status={property.status} />
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="card">
          <div className="flex items-center
                        justify-between mb-4">
            <h2 className="section-title mb-0">
              Recent payments received
            </h2>
          </div>

          {revenue.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12
                                   text-gray-200
                                   mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No payments received yet
                </p>
              </div>
          ) : (
              <div className="space-y-3">
                {revenue.slice(0, 5).map(payment => (
                    <div
                        key={payment.id}
                        className="flex items-center
                           justify-between p-3
                           rounded-lg bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium
                                text-gray-900 font-mono">
                          {payment.paystackReference
                              || payment.id.slice(0, 12)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                              payment.paidAt || payment.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                  <span className="font-semibold
                                   text-brand-green">
                    +GHS {payment.amount.toLocaleString()}
                  </span>
                        <Badge status={payment.status} />
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>

      </div>
  )
}