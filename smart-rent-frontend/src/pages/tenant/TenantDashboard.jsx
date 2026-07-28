import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CreditCard,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import BookingService from '../../services/booking.service'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function TenantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [b, p] = await Promise.all([
          BookingService.getMyBookings(),
          PaymentService.getMyPayments(),
        ])
        setBookings(b)
        setPayments(p)
      } catch {
        // Fail silently — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeBookings = bookings.filter(b =>
      ['CONFIRMED', 'PAYMENT_INITIATED'].includes(
          b.bookingStatus
      )
  )

  const totalSpent = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
        <div className="min-h-[60vh] flex
                      items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    )
  }

  return (
      <div className="page-container">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here is an overview of your rental activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3
                      gap-4 mb-8">
          {[
            {
              label: 'Active bookings',
              value: activeBookings.length,
              icon: CalendarDays,
              color: 'text-blue-600 bg-blue-50',
              action: () => navigate('/tenant/bookings'),
            },
            {
              label: 'Total bookings',
              value: bookings.length,
              icon: Clock,
              color: 'text-purple-600 bg-purple-50',
              action: () => navigate('/tenant/bookings'),
            },
            {
              label: 'Total spent',
              value: `GHS ${totalSpent.toLocaleString()}`,
              icon: CreditCard,
              color: 'text-green-600 bg-green-50',
              action: () => navigate('/tenant/payments'),
            },
          ].map(({ label, value, icon: Icon,
                   color, action }) => (
              <button
                  key={label}
                  onClick={action}
                  className="card text-left hover:shadow-md
                       transition-shadow cursor-pointer"
              >
                <div className={`
              inline-flex items-center justify-center
              w-10 h-10 rounded-lg mb-3 ${color}
            `}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold
                          text-gray-900">
                  {value}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {label}
                </p>
              </button>
          ))}
        </div>

        {/* Recent bookings */}
        <div className="card mb-6">
          <div className="flex items-center
                        justify-between mb-4">
            <h2 className="section-title mb-0">
              Recent bookings
            </h2>
            <button
                onClick={() => navigate('/tenant/bookings')}
                className="text-sm text-brand-green
                       hover:text-brand-dark
                       flex items-center gap-1
                       font-medium"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12
                                     text-gray-200
                                     mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  No bookings yet
                </p>
                <Button
                    onClick={() => navigate('/properties')}
                >
                  <Search className="h-4 w-4" />
                  Browse properties
                </Button>
              </div>
          ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map(booking => (
                    <div
                        key={booking.id}
                        className="flex items-center
                           justify-between p-3
                           rounded-lg bg-gray-50
                           hover:bg-gray-100
                           transition-colors cursor-pointer"
                        onClick={() =>
                            navigate('/tenant/bookings')
                        }
                    >
                      <div>
                        <p className="text-sm font-medium
                                text-gray-900">
                          Booking #{booking.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {booking.startDate} →{' '}
                          {booking.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold
                                   text-gray-900">
                    GHS {booking.totalPrice
                      .toLocaleString()}
                  </span>
                        <Badge status={booking.bookingStatus} />
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2
                      gap-4">
          <button
              onClick={() => navigate('/properties')}
              className="card text-left hover:shadow-md
                     transition-shadow border-dashed
                     border-2 border-gray-200
                     hover:border-brand-green group"
          >
            <Search className="h-8 w-8 text-gray-300
                             group-hover:text-brand-green
                             mb-3 transition-colors" />
            <h3 className="font-semibold text-gray-900">
              Find a property
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Browse and book your next home
            </p>
          </button>

          <button
              onClick={() => navigate('/tenant/payments')}
              className="card text-left hover:shadow-md
                     transition-shadow border-dashed
                     border-2 border-gray-200
                     hover:border-brand-green group"
          >
            <CreditCard className="h-8 w-8 text-gray-300
                                 group-hover:text-brand-green
                                 mb-3 transition-colors" />
            <h3 className="font-semibold text-gray-900">
              Payment history
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View all your payment records
            </p>
          </button>
        </div>

      </div>
  )
}