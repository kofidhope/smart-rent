import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, User, AlertCircle,
    FileText, Image as ImageIcon, } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

// Map a document's mime type to an icon and a human
// label so the document row can show what kind of file
// it links to without leaving the user to guess from the
// URL extension alone.
function docIcon(mime) {
  if (!mime) return FileText
  if (mime.startsWith('image/')) return ImageIcon
  return FileText
}

export default function VerificationRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [processing, setProcessing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [documents, setDocuments] = useState([])
  const [rejectionReason, setRejectionReason] = useState('')

  const load = async () => {
    setLoading(true)
    setUnavailable(false)
    try {
      const res = await api.get('/api/verification/pending')
      setRequests(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      const status = err.response?.status
      if (status === 404 || status === 503) {
        setUnavailable(true)
        setRequests([])
      } else {
        toast.error(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const viewDocuments = async (userId) => {
    setSelected(userId)
    try {
      const res = await api.get(`/api/verification/${userId}/documents`)
      setDocuments(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDecision = async (userId, decision) => {
    if (decision === 'REJECTED' && !rejectionReason) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(userId)
    try {
      await api.patch(`/api/verification/${userId}/decision`, {
        decision,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      })

      toast.success(
        decision === 'APPROVED'
          ? 'Landlord approved successfully!'
          : 'Application rejected'
      )

      setSelected(null)
      setRejectionReason('')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (unavailable) {
    return (
      <div className="page-container">
        <h1 className="page-title">Landlord verification requests</h1>
        <EmptyState
          icon={AlertCircle}
          title="Verification service not available yet"
          description="The landlord verification API is not wired on the backend. This page will work once /api/verification endpoints are added."
        />
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Landlord verification requests</h1>

      {requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All caught up!"
          description="No pending verification requests"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {req.firstName} {req.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{req.email}</p>
                  </div>
                </div>
                <Badge status={req.verificationStatus} />
              </div>

              {selected === req.id && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Submitted documents
                  </h4>
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No documents uploaded yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {documents.map((doc) => {
                        const Icon = docIcon(doc.fileType)
                        return (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-3 bg-white rounded-lg
                                border border-gray-200
                                hover:border-brand-green
                                transition-colors text-center"
                          >
                            <Icon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              {String(doc.documentType || 'DOCUMENT')
                                  .replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-brand-green">
                              View document →
                            </p>
                          </a>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-4">
                    <label htmlFor={`reason-${req.id}`} className="label">
                      Rejection reason
                      <span className="text-gray-400 font-normal ml-1">
                        (required if rejecting)
                      </span>
                    </label>
                    <textarea
                      id={`reason-${req.id}`}
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) =>
                          setRejectionReason(e.target.value)}
                      placeholder="Why is this application being rejected?"
                      className="input resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {selected !== req.id ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => viewDocuments(req.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View documents
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      loading={processing === req.id}
                      onClick={() => handleDecision(req.id, 'APPROVED')}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      loading={processing === req.id}
                      onClick={() => handleDecision(req.id, 'REJECTED')}
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
