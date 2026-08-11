import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Building2,
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
        <h1 className="page-title">My bookings</h1>

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
            <div className="space-y-4">
              {bookings.map(booking => (
                  <div key={booking.id} className="card">
                    <div className="flex flex-col
                              sm:flex-row sm:items-center
                              justify-between gap-4">

                      {/* Booking info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100
                                  rounded-lg flex
                                  items-center justify-center
                                  flex-shrink-0">
                          <Building2 className="h-5 w-5
                                         text-gray-400" />
                        </div>
                        <div>
                          <p className="font-semibold
                                  text-gray-900 text-sm">
                            Booking #{booking.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-500
                                  mt-0.5">
                            {booking.startDate} → {booking.endDate}
                          </p>
                          <p className="text-sm font-medium
                                  text-gray-700 mt-1">
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

                        {/* Pay button for pending payments */}
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

                        {/* Cancel button — opens a confirmation
                            dialog instead of using window.confirm.
                            window.confirm is modal, ugly, and
                            can't be styled. */}
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
