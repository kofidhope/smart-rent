import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {Building2, TrendingUp, Plus, ArrowRight,} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import PropertyService from '../../services/property.service'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MotionFadeUp from '../../components/ui/MotionFadeUp'
import EmptyState from '../../components/ui/EmptyState'
import ImagePlaceholder from '../../components/ui/ImagePlaceholder'

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
  const maintenanceCount = properties.filter(
      p => p.status === 'MAINTENANCE'
  ).length

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
      label: 'Total properties',
      value: properties.length,
      hint: `${availableCount} available`,
      icon: Building2,
      variant: 'info',
    },
    {
      label: 'Available',
      value: availableCount,
      hint: 'Ready to rent',
      icon: Building2,
      variant: 'success',
    },
    {
      label: 'Rented out',
      value: rentedCount,
      hint: maintenanceCount
          ? `${maintenanceCount} in maintenance`
          : 'All tenants in good standing',
      icon: Building2,
      variant: 'warning',
    },
    {
      label: 'Total revenue',
      value: `GHS ${Number(totalRevenue).toLocaleString()}`,
      hint: `${revenue.length} ${revenue.length === 1
          ? 'payment' : 'payments'}`,
      icon: TrendingUp,
      variant: 'success',
    },
  ]

  return (
      <div className="page-container">

        <div className="flex flex-col gap-5 sm:flex-row
                      sm:items-end sm:justify-between
                      mb-10">
          <div>
            <span className="eyebrow">Landlord dashboard</span>
            <h1 className="mt-3 text-3xl font-bold text-gray-900
                       tracking-tight">
              Welcome, {user?.firstName}.
            </h1>
            <p className="text-gray-500 mt-2">
              A snapshot of your properties and revenue.
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
                      gap-4 mb-10">
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

        {/* Properties overview */}
        <div className="card mb-6">
          <div className="flex items-center
                        justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900
                       tracking-tight">
              My properties
            </h2>
            {properties.length > 0 && (
                <button
                    onClick={() =>
                        navigate('/landlord/properties')
                    }
                    className="text-meta text-brand-green
                       hover:text-brand-dark
                       flex items-center gap-1
                       font-medium"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5"/>
                </button>
            )}
          </div>

          {properties.length === 0 ? (
              <EmptyState
                  image={<ImagePlaceholder title="No properties yet" type="building" />}
                  title="No properties yet"
                  description="List your first property to start receiving bookings"
                  actionLabel="Add your first property"
                  onAction={() =>
                      navigate('/landlord/properties/new')}
              />
          ) : (
              <div className="divide-y divide-gray-100 -mx-6">
                {properties.slice(0, 4).map(property => (
                    <div
                        key={property.id}
                        className="flex items-center
                           justify-between px-6 py-4
                           hover:bg-gray-50
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
                        <p className="text-meta text-gray-500 mt-1">
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
                        justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900
                       tracking-tight">
              Recent payments received
            </h2>
          </div>

          {revenue.length === 0 ? (
              <p className="text-meta text-gray-500 text-center py-6">
                No payments received yet
              </p>
          ) : (
              <div className="divide-y divide-gray-100 -mx-6">
                {revenue.slice(0, 5).map(payment => (
                    <div
                        key={payment.id}
                        className="flex items-center
                           justify-between px-6 py-4
                           hover:bg-gray-50
                           transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium
                                text-gray-900 font-mono">
                          {payment.paystackReference
                              || payment.id.slice(0, 12)}
                        </p>
                        <p className="text-meta text-gray-500 mt-1">
                          {new Date(
                              payment.paidAt || payment.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                  <span className="font-semibold
                                   text-brand-green
                                   tracking-tight">
                    +GHS {(payment.amount || 0)
                        .toLocaleString()}
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
