import { useState, useEffect } from 'react'
import {CheckCircle, XCircle, Eye, User,} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function VerificationRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [documents, setDocuments] = useState([])
  const [rejectionReason, setRejectionReason] =
      useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(
          '/api/verification/pending'
      )
      setRequests(res.data)
    } catch (err) {
      toast.error('Failed to load verification requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const viewDocuments = async (userId) => {
    setSelected(userId)
    try {
      const res = await api.get(
          `/api/verification/${userId}/documents`
      )
      setDocuments(res.data)
    } catch {
      toast.error('Could not load documents')
    }
  }

  const handleDecision = async (userId, decision) => {
    if (decision === 'REJECTED' && !rejectionReason) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(userId)
    try {
      await api.patch(
          `/api/verification/${userId}/decision`,
          {
            decision,
            rejectionReason: decision === 'REJECTED'
                ? rejectionReason : null,
          }
      )

      toast.success(
          decision === 'APPROVED'
              ? 'Landlord approved successfully!'
              : 'Application rejected'
      )

      setSelected(null)
      setRejectionReason('')
      load()

    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(null)
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

        <h1 className="page-title">
          Landlord verification requests
        </h1>

        {requests.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="h-16 w-16
                                   text-gray-200
                                   mx-auto mb-4" />
              <h3 className="text-lg font-semibold
                         text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-500 text-sm">
                No pending verification requests
              </p>
            </div>
        ) : (
            <div className="space-y-4">
              {requests.map(req => (
                  <div key={req.id} className="card">

                    {/* User info */}
                    <div className="flex items-start
                              justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100
                                  rounded-full flex
                                  items-center
                                  justify-center">
                          <User className="h-5 w-5
                                    text-gray-400" />
                        </div>
                        <div>
                          <p className="font-semibold
                                  text-gray-900">
                            {req.firstName} {req.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {req.email}
                          </p>
                        </div>
                      </div>
                      <Badge status={req.verificationStatus} />
                    </div>

                    {/* Document viewer */}
                    {selected === req.id && (
                        <div className="mb-4 p-4 bg-gray-50
                                rounded-lg">
                          <h4 className="font-medium
                                 text-gray-900 mb-3">
                            Submitted documents
                          </h4>
                          {documents.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                No documents uploaded yet
                              </p>
                          ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {documents.map(doc => (
                                  <a>
                                    key={doc.id}
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block p-3 bg-white
                                  rounded-lg border
                                  border-gray-200
                                  hover:border-brand-green
                                  transition-colors
                                  text-center"

                                  <p className="text-xs
                                  font-medium
                                  text-gray-700
                                  mb-1">
                                {doc.documentType
                                  .replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs
                                        text-brand-green">
                                  View document →
                                  </p>
                                  </a>
                                  ))}
                              </div>
                          )}

                          {/* Rejection reason */}
                          <div className="mt-4">
                            <label className="label">
                              Rejection reason
                              <span className="text-gray-400
                                       font-normal ml-1">
                        (required if rejecting)
                      </span>
                            </label>
                            <textarea
                                rows={2}
                                value={rejectionReason}
                                onChange={(e) =>
                                    setRejectionReason(
                                        e.target.value
                                    )
                                }
                                placeholder="Why is this application being rejected?"
                                className="input resize-none"
                            />
                          </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">

                      {selected !== req.id ? (
                          <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                  viewDocuments(req.id)
                              }
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View documents
                          </Button>
                      ) : (
                          <>
                            <Button
                                size="sm"
                                loading={processing === req.id}
                                onClick={() =>
                                    handleDecision(req.id,
                                        'APPROVED')
                                }
                                className="bg-green-600
                                 hover:bg-green-700
                                 focus:ring-green-500
                                 text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                loading={processing === req.id}
                                onClick={() =>
                                    handleDecision(req.id,
                                        'REJECTED')
                                }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelected(null)
                                  setRejectionReason('')
                                }}
                            >
                              Close
                            </Button>
                          </>
                      )}
                    </div>
                  </div>
              ))}
</div>
)}
</div>
)
}