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
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MotionFadeUp from '../../components/ui/MotionFadeUp'
import EmptyState from '../../components/ui/EmptyState'

// The booking-service and payment-service both return
// paymentStatus / bookingStatus as strings; spell out
// the values we count as "active" so a future code
// change can't silently break the dashboard count.
const ACTIVE_BOOKING_STATUSES = ['CONFIRMED', 'PAYMENT_INITIATED']
const SUCCESSFUL_PAYMENT_STATUSES = ['SUCCESS', 'PAID']

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
      ACTIVE_BOOKING_STATUSES.includes(b.bookingStatus)
  )

  const totalSpent = payments
      .filter(p => SUCCESSFUL_PAYMENT_STATUSES.includes(p.status))
      .reduce((sum, p) => sum + (p.amount || 0), 0)

  if (loading) {
    return (
        <div className="min-h-[60vh] flex
                      items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    )
  }

  // Stat tiles are also clickable shortcuts — tiles
  // link to the relevant page so users can drill into
  // the full list from the dashboard.
  const stats = [
    {
      label: 'Active bookings',
      value: activeBookings.length,
      hint: `${bookings.length} total`,
      icon: CalendarDays,
      variant: 'info',
      action: () => navigate('/tenant/bookings'),
    },
    {
      label: 'Total bookings',
      value: bookings.length,
      hint: activeBookings.length > 0
          ? 'Confirmed or pending payment'
          : 'No active rentals',
      icon: Clock,
      variant: 'warning',
      action: () => navigate('/tenant/bookings'),
    },
    {
      label: 'Total spent',
      value: `GHS ${totalSpent.toLocaleString()}`,
      hint: `${payments.length} ${payments.length === 1
          ? 'payment' : 'payments'}`,
      icon: CreditCard,
      variant: 'success',
      action: () => navigate('/tenant/payments'),
    },
  ]

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

        {/* Stats — each tile is a button that drills
            into the relevant list */}
        <div className="grid grid-cols-1 sm:grid-cols-3
                      gap-4 mb-8">
          {stats.map(({ label, value, hint, icon: Icon,
                       variant, action }, i) => (
              <MotionFadeUp key={label} delay={i * 0.05}>
                <button
                    onClick={action}
                    className="stat-tile text-left w-full
                        cursor-pointer
                        hover:border-brand-green
                        focus-visible:ring-2
                        focus-visible:ring-brand-green
                        transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="stat-tile-label">
                      {label}
                    </span>
                    <div className={`stat-tile-icon ${variant}`}>
                      <Icon className="h-5 w-5"/>
                    </div>
                  </div>
                  <span className="stat-tile-value">
                    {value}
                  </span>
                  <span className="stat-tile-hint">
                    {hint}
                  </span>
                </button>
              </MotionFadeUp>
          ))}
        </div>

        {/* Recent bookings */}
        <div className="card mb-6">
          <div className="flex items-center
                        justify-between mb-4">
            <h2 className="section-title mb-0">
              Recent bookings
            </h2>
            {bookings.length > 0 && (
                <button
                    onClick={() => navigate('/tenant/bookings')}
                    className="text-sm text-brand-green
                       hover:text-brand-dark
                       flex items-center gap-1
                       font-medium"
                >
                  View all
                  <ArrowRight className="h-4 w-4"/>
                </button>
            )}
          </div>

          {bookings.length === 0 ? (
              <EmptyState
                  icon={CalendarDays}
                  title="No bookings yet"
                  description="Browse properties and book your next home"
                  actionLabel="Browse properties"
                  onAction={() => navigate('/properties')}
              />
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
                        <Badge status={booking.bookingStatus}/>
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
                             mb-3 transition-colors"/>
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
                                 mb-3 transition-colors"/>
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
