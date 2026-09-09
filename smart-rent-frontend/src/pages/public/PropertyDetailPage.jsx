import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {MapPin, BedDouble, Bath, User, ChevronLeft, ChevronRight, Building2, CheckCircle,
} from 'lucide-react'
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
import DatePicker from '../../components/ui/DatePicker'

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
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Calculate total price from selected dates.
  // Listings are priced per month but tenants can book
  // for any number of days, so we normalise to months.
  const calculateTotal = () => {
    if (!startDate || !endDate || !property) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Total days between dates
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (days <= 0) return null

    // Enforce minimum 30 days
    // A rental property is not a hotel
    if (days < 30) {
      return {
        days,
        months: null,
        total: null,
        error: 'Minimum rental period is 30 days'
      }
    }

    // Round to whole months
    // 45 days = 1.5 months = GHS 977 × 1.5
    const months = Math.round((days / 30) * 10) / 10

    const total = (property.price * months).toFixed(2)

    return { days, months, total, error: null }
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
                    {/* Main image — crossfade on swap */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.img
                          key={images[activeImage]?.id
                              || activeImage}
                          src={images[activeImage]?.imageUrl}
                          alt={property.title}
                          className="w-full h-64 sm:h-80
                             lg:h-96 object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                      />
                    </AnimatePresence>

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
                                 w-9 h-9 bg-black/50
                                 rounded-full flex
                                 items-center justify-center
                                 text-white hover:bg-black/70
                                 transition-colors"
                              aria-label="Previous image"
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
                                 w-9 h-9 bg-black/50
                                 rounded-full flex
                                 items-center justify-center
                                 text-white hover:bg-black/70
                                 transition-colors"
                              aria-label="Next image"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Dot indicators */}
                          <div className="absolute bottom-3
                                    left-1/2
                                    -translate-x-1/2
                                    flex gap-2">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() =>
                                        setActiveImage(i)
                                    }
                                    aria-label={`Show image ${i + 1}`}
                                    aria-current={i === activeImage
                                        ? 'true' : undefined}
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
                              justify-center">
                    {/* Use Unsplash Source for real property photography placeholder */}
                    <img
                        src={`https://source.unsplash.com/random/1200x800?${property?.type?.toLowerCase() || 'real-estate'},house`}
                        alt={`${property?.title || 'Property'} — placeholder`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            // Fallback to abstract property image if specific search fails
                            e.target.src = 'https://source.unsplash.com/random/1200x800?real-estate,property';
                        }}
                    />
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
                            aria-label={`Show image ${i + 1}`}
                            aria-current={i === activeImage
                                ? 'true' : undefined}
                            className={`
                      flex-shrink-0 w-16 h-12
                      rounded-lg overflow-hidden
                      transition-all
                      ${i === activeImage
                                ? 'ring-2 ring-brand-green scale-105'
                                : 'opacity-60 hover:opacity-100'
                            }
                    `}
                        >
                          <img
                              src={img.imageUrl}
                              alt=""
                              className="w-full h-full
                                 object-cover"
                              loading="lazy"
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
                <h1 className="text-2xl sm:text-3xl
                             font-bold text-gray-900
                             tracking-tight leading-tight">
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
                            text-gray-500 mb-6">
                <MapPin className="h-4 w-4
                                 flex-shrink-0" />
                <span className="text-sm">
                {property.address}, {property.city}
              </span>
              </div>

              {/* Key details — quieter, dividers
                  instead of stacked icons. */}
              <div className="grid grid-cols-3 gap-px
                            bg-gray-100
                            py-px border border-gray-100
                            rounded-card overflow-hidden
                            mb-6">
                <div className="bg-white p-4 text-center">
                  <BedDouble className="h-5 w-5
                                      text-gray-400
                                      mx-auto mb-2" />
                  <p className="text-base font-semibold
                              text-gray-900">
                    {property.bedrooms}
                  </p>
                  <p className="text-meta text-gray-500">
                    Bedroom{property.bedrooms !== 1
                      ? 's' : ''}
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <Bath className="h-5 w-5 text-gray-400
                                 mx-auto mb-2" />
                  <p className="text-base font-semibold
                              text-gray-900">
                    {property.bathrooms}
                  </p>
                  <p className="text-meta text-gray-500">
                    Bathroom{property.bathrooms !== 1
                      ? 's' : ''}
                  </p>
                </div>
                <div className="bg-white p-4 text-center">
                  <User className="h-5 w-5 text-gray-400
                                 mx-auto mb-2" />
                  <p className="text-base font-semibold
                              text-gray-900 truncate">
                    {property.ownerName}
                  </p>
                  <p className="text-meta text-gray-500">
                    Owner
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900
                           mb-3 tracking-tight">
                  About this property
                </h2>
                <p className="text-base text-gray-600
                            leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN — BOOKING PANEL ─────────── */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24
                      max-h-[calc(100dvh-7rem)]
                      overflow-y-auto">

              {/* Price — larger, tracking-tight */}
              <div className="mb-1">
                <span className="text-4xl font-bold
                               text-gray-900
                               tracking-tight">
                  GHS {property.price.toLocaleString()}
                </span>
              </div>
              <p className="text-meta text-gray-500 mb-6">
                per month
              </p>

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
                        className="space-y-4"
                        noValidate
                    >
                      <input
                          type="hidden"
                          {...register('startDate', {
                            required: 'Move-in date is required',
                          })}
                      />
                      <input
                          type="hidden"
                          {...register('endDate', {
                            required: 'Move-out date is required',
                          })}
                      />

                      {/* Date fields - side by side on larger screens */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Start date */}
                        <DatePicker
                            id="startDate"
                            label="Move-in date"
                            selected={startDate ? new Date(startDate) : null}
                            onChange={(date) => {
                              setValue('startDate',
                                  date?.toISOString().split('T')[0] || '',
                                  { shouldDirty: true, shouldValidate: true })
                            }}
                            minDate={new Date()}
                            placeholderText="Select move-in date"
                            error={errors.startDate?.message}
                            required
                        />

                      {/* End date */}
                      <DatePicker
                          id="endDate"
                          label="Move-out date"
                          selected={endDate ? new Date(endDate) : null}
                          onChange={(date) => {
                            setValue('endDate',
                                date?.toISOString().split('T')[0] || '',
                                { shouldDirty: true, shouldValidate: true })
                          }}
                          minDate={startDate
                              ? new Date(startDate)
                              : new Date()
                          }
                          placeholderText="Select move-out date"
                          error={errors.endDate?.message}
                          required
                        />
                      </div>

                      {/* Price breakdown — quieter background, tighter numbers */}
                      {priceCalc && (
                          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                            {priceCalc.error ? (
                                // Show error for bookings under 30 days
                                <div className="flex items-center gap-2 text-warning-text">
                                  <span className="text-warning-icon">⚠</span>
                                  <span>{priceCalc.error}</span>
                                </div>
                            ) : (
                                <>
                                  <div className="flex justify-between text-gray-600">
                                    <span>Duration</span>
                                    <span>
                                      {priceCalc.days} days
                                      ({priceCalc.months} months)
                                    </span>
                                  </div>

                                  <div className="flex justify-between
                                    text-gray-600">
                                    <span>Monthly rate</span>
                                    <span>
                                     GHS {property.price.toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="border-t border-gray-200
                                    pt-2 flex justify-between
                                     font-semibold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-brand-green">
                                      GHS {Number(priceCalc.total)
                                        .toLocaleString()}
                                    </span>
                                  </div>
                                </>
                            )}

                          </div>
                      )}

                      {/* Submit */}
                      {isTenant ? (
                          <Button
                              type="submit"
                              fullWidth
                              loading={booking}
                              // Disable if dates not selected or error
                              disabled={
                                  !startDate ||
                                  !endDate ||
                                  (priceCalc && priceCalc.error !== null)
                              }
                          >
                            {booking ? 'Processing...' : 'Book now'}
                          </Button>
                      ) : isAuthenticated ? (
                          <p className="text-meta text-center
                                  text-gray-400 py-2">
                            Only tenants can book properties.
                          </p>
                      ) : (
                          <Button
                              type="button"
                              fullWidth
                              size="lg"
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

                    {/* Trust signals — enhanced with better visual hierarchy */}
                    <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Why book with SmartRent?
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            icon: CheckCircle,
                            text: 'Secure payment via Paystack',
                            color: 'text-brand-green'
                          },
                          {
                            icon: CheckCircle,
                            text: 'Instant booking confirmation',
                            color: 'text-brand-green'
                          },
                          {
                            icon: CheckCircle,
                            text: 'SMS notification on success',
                            color: 'text-brand-green'
                          },
                        ].map(({ icon: Icon, text, color }) => (
                          <div key={text} className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                            <p className="text-meta text-gray-600">{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
              )}

            </div>
          </div>
        </div>
      </div>
  )
}
