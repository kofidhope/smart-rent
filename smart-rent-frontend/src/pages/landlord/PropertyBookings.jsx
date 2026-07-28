import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import BookingService from '../../services/booking.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

export default function PropertyBookings() {
  const { propertyId } = useParams()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await BookingService
            .getByProperty(propertyId)
        setBookings(data)
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

        <h1 className="page-title">Property bookings</h1>

        <ErrorMessage message={error} className="mb-6" />

        {bookings.length === 0 ? (
            <div className="text-center py-20">
              <CalendarDays className="h-16 w-16
                                   text-gray-200
                                   mx-auto mb-4" />
              <h3 className="text-lg font-semibold
                         text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-500 text-sm">
                Bookings for this property will appear here
              </p>
            </div>
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