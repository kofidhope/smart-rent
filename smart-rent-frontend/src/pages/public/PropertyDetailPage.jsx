import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {MapPin, BedDouble, Bath, User, ChevronLeft, ChevronRight, Calendar, CheckCircle, Building2,} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PropertyService from '../../services/property.service'
import BookingService from '../../services/booking.service'
import PaymentService from '../../services/payment.service'
import useAuth from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isTenant } = useAuth()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Calculate total price from selected dates
  const calculateTotal = () => {
    if (!startDate || !endDate || !property) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (nights <= 0) return null
    const months = nights / 30
    return {
      nights,
      total: (property.price * months).toFixed(2),
    }
  }

  const priceCalc = calculateTotal()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await PropertyService.getById(id)
        setProperty(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onBookingSubmit = async ({ startDate, endDate }) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `/properties/${id}` },
      })
      return
    }

    setBooking(true)
    setBookingError('')

    try {
      // Step 1 — create booking
      const newBooking = await BookingService.create({
        propertyId: id,
        startDate,
        endDate,
      })

      toast.success('Booking created! Redirecting to payment...')

      // Step 2 — wait for payment record
      const payment = await PaymentService
          .waitForPayment(newBooking.id)

      // Step 3 — redirect to Paystack
      window.location.href = payment.authorizationUrl

    } catch (err) {
      setBookingError(err.message)
    } finally {
      setBooking(false)
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

  if (error || !property) {
    return (
        <div className="page-container">
          <ErrorMessage
              message={error || 'Property not found'}
          />
          <Button
              variant="secondary"
              className="mt-4"
              onClick={() => navigate('/properties')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to properties
          </Button>
        </div>
    )
  }

  const images = property.images?.length > 0
      ? property.images
      : null

  return (
      <div className="page-container max-w-6xl">

        {/* Back button */}
        <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-1 text-gray-500
                   hover:text-gray-700 text-sm mb-6
                   transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to properties
        </button>

        <div className="grid grid-cols-1
                      lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image gallery */}
            <div className="rounded-xl overflow-hidden
                          bg-gray-100">
              {images ? (
                  <div className="relative">
                    {/* Main image */}
                    <img
                        src={images[activeImage]?.imageUrl}
                        alt={property.title}
                        className="w-full h-64 sm:h-80
                             lg:h-96 object-cover"
                    />

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                          <button
                              onClick={() =>
                                  setActiveImage(i =>
                                      i === 0
                                          ? images.length - 1
                                          : i - 1
                                  )
                              }
                              className="absolute left-3
                                 top-1/2 -translate-y-1/2
                                 w-8 h-8 bg-black/40
                                 rounded-full flex
                                 items-center justify-center
                                 text-white hover:bg-black/60
                                 transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                              onClick={() =>
                                  setActiveImage(i =>
                                      i === images.length - 1
                                          ? 0
                                          : i + 1
                                  )
                              }
                              className="absolute right-3
                                 top-1/2 -translate-y-1/2
                                 w-8 h-8 bg-black/40
                                 rounded-full flex
                                 items-center justify-center
                                 text-white hover:bg-black/60
                                 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Dot indicators */}
                          <div className="absolute bottom-3
                                    left-1/2
                                    -translate-x-1/2
                                    flex gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() =>
                                        setActiveImage(i)
                                    }
                                    className={`
                            w-2 h-2 rounded-full
                            transition-colors
                            ${i === activeImage
                                        ? 'bg-white'
                                        : 'bg-white/50'
                                    }
                          `}
                                />
                            ))}
                          </div>
                        </>
                    )}

                    {/* Image counter */}
                    <div className="absolute top-3 right-3
                                bg-black/50 text-white
                                text-xs px-2 py-1
                                rounded-full">
                      {activeImage + 1} / {images.length}
                    </div>
                  </div>
              ) : (
                  <div className="h-64 sm:h-80 flex
                              flex-col items-center
                              justify-center text-gray-300">
                    <Building2 className="h-16 w-16 mb-2" />
                    <span className="text-sm">No photos yet</span>
                  </div>
              )}

              {/* Thumbnail strip */}
              {images && images.length > 1 && (
                  <div className="flex gap-2 p-3
                              overflow-x-auto">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={() => setActiveImage(i)}
                            className={`
                      flex-shrink-0 w-16 h-12
                      rounded-lg overflow-hidden
                      transition-all
                      ${i === activeImage
                                ? 'ring-2 ring-brand-green'
                                : 'opacity-60 hover:opacity-100'
                            }
                    `}
                        >
                          <img
                              src={img.imageUrl}
                              alt=""
                              className="w-full h-full
                                 object-cover"
                          />
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Property info */}
            <div className="card">

              {/* Title and badges */}
              <div className="flex items-start
                            justify-between gap-4 mb-4">
                <h1 className="text-xl sm:text-2xl
                             font-bold text-gray-900">
                  {property.title}
                </h1>
                <div className="flex flex-col
                              items-end gap-2
                              flex-shrink-0">
                  <Badge status={property.status} />
                  <Badge status={property.type} />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2
                            text-gray-500 mb-4">
                <MapPin className="h-4 w-4
                                 flex-shrink-0" />
                <span className="text-sm">
                {property.address}, {property.city}
              </span>
              </div>

              {/* Key details */}
              <div className="grid grid-cols-3 gap-4
                            py-4 border-t border-b
                            border-gray-100 mb-4">
                <div className="text-center">
                  <BedDouble className="h-5 w-5
                                      text-gray-400
                                      mx-auto mb-1" />
                  <p className="text-sm font-semibold
                              text-gray-900">
                    {property.bedrooms}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bedroom{property.bedrooms !== 1
                      ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <Bath className="h-5 w-5 text-gray-400
                                 mx-auto mb-1" />
                  <p className="text-sm font-semibold
                              text-gray-900">
                    {property.bathrooms}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bathroom{property.bathrooms !== 1
                      ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <User className="h-5 w-5 text-gray-400
                                 mx-auto mb-1" />
                  <p className="text-sm font-semibold
                              text-gray-900 truncate">
                    {property.ownerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Owner
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="section-title">
                  About this property
                </h2>
                <p className="text-gray-600 text-sm
                            leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN — BOOKING PANEL ─────────── */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">

              {/* Price */}
              <div className="mb-4">
              <span className="text-3xl font-bold
                               text-brand-green">
                GHS {property.price.toLocaleString()}
              </span>
                <span className="text-gray-400 text-sm">
                /month
              </span>
              </div>

              {property.status !== 'AVAILABLE' ? (
                  <div className="text-center py-6">
                    <Badge status={property.status} />
                    <p className="text-gray-500 text-sm mt-3">
                      This property is not available
                      for booking right now.
                    </p>
                  </div>
              ) : (
                  <>
                    {/* Booking error */}
                    <ErrorMessage
                        message={bookingError}
                        className="mb-4"
                    />

                    {/* Booking form */}
                    <form
                        onSubmit={handleSubmit(onBookingSubmit)}
                        className="space-y-3"
                    >
                      {/* Start date */}
                      <div>
                        <label className="label">
                          <Calendar className="inline
                                           h-3.5 w-3.5
                                           mr-1" />
                          Move-in date
                        </label>
                        <input
                            type="date"
                            className={`input ${
                                errors.startDate
                                    ? 'input-error' : ''
                            }`}
                            min={
                              new Date()
                                  .toISOString()
                                  .split('T')[0]
                            }
                            {...register('startDate', {
                              required: 'Start date required',
                            })}
                        />
                        {errors.startDate && (
                            <p className="error-text">
                              {errors.startDate.message}
                            </p>
                        )}
                      </div>

                      {/* End date */}
                      <div>
                        <label className="label">
                          <Calendar className="inline
                                           h-3.5 w-3.5
                                           mr-1" />
                          Move-out date
                        </label>
                        <input
                            type="date"
                            className={`input ${
                                errors.endDate ? 'input-error' : ''
                            }`}
                            min={startDate ||
                                new Date()
                                    .toISOString()
                                    .split('T')[0]
                            }
                            {...register('endDate', {
                              required: 'End date required',
                              validate: (value) =>
                                  !startDate ||
                                  value > startDate ||
                                  'End date must be after start',
                            })}
                        />
                        {errors.endDate && (
                            <p className="error-text">
                              {errors.endDate.message}
                            </p>
                        )}
                      </div>

                      {/* Price breakdown */}
                      {priceCalc && (
                          <div className="bg-gray-50 rounded-lg
                                    p-3 text-sm space-y-1">
                            <div className="flex justify-between
                                      text-gray-600">
                        <span>
                          GHS {property.price}/month ×{' '}
                          {priceCalc.nights} days
                        </span>
                            </div>
                            <div className="flex justify-between
                                      font-semibold
                                      text-gray-900
                                      border-t border-gray-200
                                      pt-1 mt-1">
                              <span>Total</span>
                              <span className="text-brand-green">
                          GHS {priceCalc.total}
                        </span>
                            </div>
                          </div>
                      )}

                      {/* Submit */}
                      {isTenant ? (
                          <Button
                              type="submit"
                              fullWidth
                              loading={booking}
                          >
                            {booking
                                ? 'Processing...'
                                : 'Book now'
                            }
                          </Button>
                      ) : isAuthenticated ? (
                          <p className="text-xs text-center
                                  text-gray-400 py-2">
                            Only tenants can book properties.
                          </p>
                      ) : (
                          <Button
                              type="button"
                              fullWidth
                              onClick={() =>
                                  navigate('/login', {
                                    state: {
                                      from: `/properties/${id}`,
                                    },
                                  })
                              }
                          >
                            Login to book
                          </Button>
                      )}

                    </form>

                    {/* Trust signals */}
                    <div className="mt-4 space-y-2">
                      {[
                        'Secure payment via Paystack',
                        'Instant booking confirmation',
                        'SMS notification sent to you',
                      ].map(item => (
                          <div
                              key={item}
                              className="flex items-center
                                 gap-2 text-xs
                                 text-gray-500"
                          >
                            <CheckCircle className="h-3.5 w-3.5
                                             text-brand-green
                                             flex-shrink-0" />
                            {item}
                          </div>
                      ))}
                    </div>
                  </>
              )}

            </div>
          </div>
        </div>
      </div>
  )
}