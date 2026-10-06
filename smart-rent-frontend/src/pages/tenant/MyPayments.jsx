import { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import PaymentService from '../../services/payment.service'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import EmptyState from '../../components/ui/EmptyState'
import MotionFadeUp from '../../components/ui/MotionFadeUp'

// Both names appear in the codebase depending on
// which service produced the payment record.
const PAID_STATUSES = ['SUCCESS', 'PAID']

export default function MyPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await PaymentService.getMyPayments()
        setPayments(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const paidRecords = payments.filter(
      p => PAID_STATUSES.includes(p.status)
  )
  const totalPaid = paidRecords
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  const failedCount = payments
      .filter(p => p.status === 'FAILED').length

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
        <h1 className="page-title">My payments</h1>

        <ErrorMessage message={error} className="mb-6" />

        {/* Summary cards */}
        {payments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3
                          gap-4 mb-6">
              <MotionFadeUp delay={0}>
                <div className="stat-tile">
                  <div className="flex items-center justify-between">
                    <span className="stat-tile-label">
                      Total paid
                    </span>
                    <div className="stat-tile-icon success">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <span className="stat-tile-value">
                    GHS {totalPaid.toLocaleString()}
                  </span>
                  <span className="stat-tile-hint">
                    Across {paidRecords.length} successful
                  </span>
                </div>
              </MotionFadeUp>

              <MotionFadeUp delay={0.05}>
                <div className="stat-tile">
                  <div className="flex items-center justify-between">
                    <span className="stat-tile-label">
                      Successful
                    </span>
                    <div className="stat-tile-icon info">
                      <CreditCard className="h-5 w-5" />
                    </div>
                  </div>
                  <span className="stat-tile-value">
                    {paidRecords.length}
                  </span>
                  <span className="stat-tile-hint">
                    Payments went through
                  </span>
                </div>
              </MotionFadeUp>

              <MotionFadeUp delay={0.1}>
                <div className="stat-tile">
                  <div className="flex items-center justify-between">
                    <span className="stat-tile-label">
                      Failed
                    </span>
                    <div className="stat-tile-icon danger">
                      <XCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <span className="stat-tile-value">
                    {failedCount}
                  </span>
                  <span className="stat-tile-hint">
                    Need to retry
                  </span>
                </div>
              </MotionFadeUp>
            </div>
        )}

        {payments.length === 0 ? (
            <EmptyState
                icon={CreditCard}
                title="No payments yet"
                description="Your payment history will appear here"
            />
        ) : (
            <>
              {/* ── DESKTOP — table ──────────────────── */}
              <div className="hidden sm:block
                          table-container">
                <table className="table">
                  <thead>
                  <tr>
                    {['Reference', 'Amount',
                      'Status', 'Channel', 'Date']
                        .map(h => (
                            <th key={h}>{h}</th>
                        ))
                    }
                  </tr>
                  </thead>
                  <tbody>
                  {payments.map(payment => (
                      <tr key={payment.id}>
                        <td className="font-mono text-meta">
                          {payment.paystackReference
                              || payment.id.slice(0, 12)}
                        </td>
                        <td className="font-semibold
                                   text-gray-900">
                          GHS {payment.amount
                              ? payment.amount.toLocaleString()
                              : '—'}
                        </td>
                        <td>
                          <Badge status={payment.status} />
                        </td>
                        <td className="capitalize">
                          {payment.channel || '—'}
                        </td>
                        <td className="text-meta
                                   text-gray-500">
                          {payment.paidAt
                              ? new Date(payment.paidAt)
                                  .toLocaleDateString()
                              : new Date(payment.createdAt)
                                  .toLocaleDateString()
                          }
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE — card list ────────────────── */}
              {/* Replaces the table on small screens    */}
              {/* Much easier to read on 375px screens   */}
              <div className="sm:hidden space-y-3">
                {payments.map(payment => (
                    <div key={payment.id} className="card p-4">

                      {/* Top row — ref and amount */}
                      <div className="flex items-start
                                justify-between mb-3">
                        <div>
                          <p className="font-mono text-meta
                                  text-gray-500">
                            {payment.paystackReference
                                || payment.id.slice(0, 16)}
                          </p>
                          <p className="text-xl font-bold
                                  text-gray-900 mt-0.5">
                            GHS {payment.amount
                                ? payment.amount.toLocaleString()
                                : '—'}
                          </p>
                        </div>
                        <Badge status={payment.status} />
                      </div>

                      {/* Bottom row — channel and date */}
                      <div className="flex items-center
                                justify-between
                                pt-3 border-t
                                border-gray-100">
                        <div className="flex items-center
                                  gap-1.5 text-meta
                                  text-gray-500">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span className="capitalize">
                            {payment.channel || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center
                                  gap-1.5 text-meta
                                  text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {payment.paidAt
                                ? new Date(payment.paidAt)
                                    .toLocaleDateString()
                                : new Date(payment.createdAt)
                                    .toLocaleDateString()
                            }
                          </span>
                        </div>
                      </div>

                    </div>
                ))}
              </div>
            </>
        )}
      </div>
  )
}
