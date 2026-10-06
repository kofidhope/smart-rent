import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import BookingService from '../../services/booking.service'
import PropertyService from '../../services/property.service'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import EmptyState from '../../components/ui/EmptyState'

export default function PropertyBookings() {
  const { propertyId } = useParams()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [propertyTitle, setPropertyTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch property and bookings in parallel. Either
    // can fail independently — we degrade gracefully:
    // a missing title just leaves the page heading on
    // "Property bookings" instead of the title.
    const load = async () => {
      setLoading(true)
      try {
        const [bookingsResult, propertyResult] =
            await Promise.allSettled([
              BookingService.getByProperty(propertyId),
              PropertyService.getById(propertyId),
            ])

        if (bookingsResult.status === 'fulfilled') {
          setBookings(bookingsResult.value)
        } else {
          setError(bookingsResult.reason?.message
              || 'Failed to load bookings')
        }

        if (propertyResult.status === 'fulfilled') {
          setPropertyTitle(propertyResult.value.title || '')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [propertyId])

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

        <button
            onClick={() => navigate('/landlord/properties')}
            className="flex items-center gap-1
                   text-gray-500 hover:text-gray-700
                   text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to properties
        </button>

        <h1 className="page-title">
          {propertyTitle
              ? `${propertyTitle} — bookings`
              : 'Property bookings'}
        </h1>

        <ErrorMessage message={error} className="mb-6" />

        {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="Bookings for this property will appear here"
            />
        ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                  <div key={booking.id} className="card">
                    <div className="flex flex-col sm:flex-row
                              sm:items-center
                              justify-between gap-4">
                      <div>
                        <p className="font-semibold
                                text-gray-900 text-sm">
                          Booking #{booking.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500
                                mt-0.5">
                          {booking.startDate} →{' '}
                          {booking.endDate}
                        </p>
                        <p className="text-sm font-medium
                                text-gray-700 mt-1">
                          GHS {booking.totalPrice
                            .toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center
                                gap-2 flex-wrap">
                        <Badge status={booking.bookingStatus} />
                        <Badge status={booking.paymentStatus} />
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  )
}