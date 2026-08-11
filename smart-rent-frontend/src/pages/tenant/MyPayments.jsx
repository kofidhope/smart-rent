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

  const totalPaid = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0)

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
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                {
                  label: 'Total paid',
                  value: `GHS ${totalPaid.toLocaleString()}`,
                  icon: CheckCircle,
                  color: 'text-success-icon bg-success-bg',
                },
                {
                  label: 'Successful',
                  value: payments.filter(
                      p => p.status === 'SUCCESS'
                  ).length,
                  icon: CheckCircle,
                  color: 'text-info-icon bg-info-bg',
                },
                {
                  label: 'Failed',
                  value: payments.filter(
                      p => p.status === 'FAILED'
                  ).length,
                  icon: XCircle,
                  color: 'text-danger-icon bg-danger-bg',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card text-center">
                    <div className={`
                inline-flex items-center justify-center
                w-10 h-10 rounded-xl mb-2 ${color}
              `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xl font-bold
                            text-gray-900">
                      {value}
                    </p>
                    <p className="text-meta text-gray-500 mt-0.5">
                      {label}
                    </p>
                  </div>
              ))}
            </div>
        )}

        {payments.length === 0 ? (
            <div className="empty-state">
              <CreditCard className="empty-state-icon" />
              <p className="empty-state-title">
                No payments yet
              </p>
              <p className="empty-state-text">
                Your payment history will appear here
              </p>
            </div>
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
                            .toLocaleString()}
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
                              .toLocaleString()}
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