import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

function formatMoney(amount, currency = 'GHS') {
  const value = Number(amount || 0)
  return `${currency} ${value.toLocaleString()}`
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function MyPayments() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await PaymentService.getMyPayments()
      setPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleContinuePayment = (payment) => {
    if (payment.authorizationUrl) {
      window.location.href = payment.authorizationUrl
      return
    }
    toast.error('Payment link is not ready yet. Try again shortly.')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My payments</h1>
      <ErrorMessage message={error} className="mb-6" />

      {payments.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No payments yet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Payments appear here after you book a property.
          </p>
          <Button onClick={() => navigate('/properties')}>
            Browse properties
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatMoney(payment.amount, payment.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Booking {String(payment.bookingId).slice(0, 8)}…
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {payment.channel
                        ? `Via ${payment.channel.replace(/_/g, ' ')} · `
                        : ''}
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Badge status={payment.status} />

                  {(payment.status === 'PENDING' ||
                    payment.status === 'PROCESSING' ||
                    payment.status === 'UNPAID') &&
                    payment.authorizationUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleContinuePayment(payment)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Continue payment
                      </Button>
                    )}
                </div>
              </div>

              {payment.failureReason && (
                <p className="text-sm text-red-600 mt-3">
                  {payment.failureReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
