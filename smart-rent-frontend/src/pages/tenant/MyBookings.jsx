import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ExternalLink,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BookingService from '../../services/booking.service'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// Bookings that are still in a cancellable state.
// PENDING = awaiting landlord/auto-confirm,
// PAYMENT_INITIATED = tenant started paying but
// hasn't finished — both safe to cancel.
const CANCELLABLE_STATUSES = ['PENDING', 'PAYMENT_INITIATED']

export default function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [bookingPendingCancel, setBookingPendingCancel] =
      useState(null)
  const [payingId, setPayingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await BookingService.getMyBookings()
      setBookings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const performCancel = async (bookingId) => {
    setCancelling(bookingId)
    try {
      await BookingService.cancel(bookingId)
      toast.success('Booking cancelled')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelling(null)
      setBookingPendingCancel(null)
    }
  }

  const handlePay = async (bookingId) => {
    // The button must show a spinner so the user
    // knows we left the page — the redirect to
    // Paystack can otherwise feel instant and confusing.
    setPayingId(bookingId)
    try {
      const payment = await PaymentService
          .waitForPayment(bookingId)
      if (payment.authorizationUrl) {
        window.location.href = payment.authorizationUrl
      } else {
        toast.error('Payment link not ready. Try again.')
        setPayingId(null)
      }
    } catch (err) {
      toast.error(err.message)
      setPayingId(null)
    }
  }

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

        <div className="mb-8">
          <span className="eyebrow">Bookings</span>
          <h1 className="mt-3 text-3xl font-bold text-gray-900
                     tracking-tight">
            My bookings
          </h1>
          <p className="text-gray-500 mt-2">
            Your active and past rental reservations.
          </p>
        </div>

        <ErrorMessage message={error} className="mb-6" />

        {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="Browse properties and make your first booking"
              actionLabel="Browse properties"
              onAction={() => navigate('/properties')}
            />
        ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {bookings.map(booking => (
                    <div key={booking.id} className="px-5 sm:px-6 py-5">
                      <div className="flex flex-col
                                  sm:flex-row sm:items-center
                                  justify-between gap-4">

                        {/* Booking info */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100
                                    rounded-btn flex
                                    items-center justify-center
                                    flex-shrink-0">
                            <img
                                src="https://source.unsplash.com/random/150x150?building,house"
                                alt="Property"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    e.target.src = 'https://source.unsplash.com/random/150x150?real-estate,property';
                                }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold
                                    text-gray-900 text-sm">
                              Booking #{booking.id.slice(0, 8)}
                            </p>
                            <p className="text-meta text-gray-500
                                    mt-1">
                              {booking.startDate} → {booking.endDate}
                            </p>
                            <p className="text-sm font-semibold
                                    text-gray-900 mt-2
                                    tracking-tight">
                              GHS {booking.totalPrice
                                .toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Status and actions */}
                        <div className="flex items-center
                                  gap-3 flex-wrap">
                          <Badge status={booking.bookingStatus} />
                          <Badge status={booking.paymentStatus} />

                          {booking.bookingStatus ===
                              'PAYMENT_INITIATED' && (
                                  <Button
                                      size="sm"
                                      loading={payingId === booking.id}
                                      onClick={() =>
                                          handlePay(booking.id)
                                      }
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Pay now
                                  </Button>
                              )}

                          {CANCELLABLE_STATUSES
                              .includes(booking.bookingStatus) && (
                              <Button
                                  variant="danger"
                                  size="sm"
                                  loading={
                                      cancelling === booking.id
                                  }
                                  onClick={() =>
                                      setBookingPendingCancel(booking)
                                  }
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </Button>
                          )}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ── Cancel confirmation ───────────────────── */}
        <ConfirmDialog
          open={!!bookingPendingCancel}
          title="Cancel this booking?"
          message={
            bookingPendingCancel
                ? `Booking #${bookingPendingCancel.id
                  .slice(0, 8)} will be cancelled. ` +
                  'This cannot be undone.'
                : ''
          }
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          variant="danger"
          loading={cancelling === bookingPendingCancel?.id}
          onConfirm={() =>
              bookingPendingCancel &&
              performCancel(bookingPendingCancel.id)
          }
          onCancel={() => setBookingPendingCancel(null)}
        />
      </div>
  )
}
