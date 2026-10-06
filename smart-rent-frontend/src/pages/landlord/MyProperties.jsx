import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Building2,
  Edit,
  Trash2,
  CalendarDays,
  Image,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PropertyService from '../../services/property.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function MyProperties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [propertyPendingDelete, setPropertyPendingDelete] =
      useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await PropertyService
          .getMyProperties()
      setProperties(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const performDelete = async (id) => {
    setDeleting(id)
    try {
      await PropertyService.delete(id)
      toast.success('Property deleted')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
      setPropertyPendingDelete(null)
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

        <div className="flex items-center
                      justify-between mb-6 gap-3">
          <h1 className="page-title mb-0">
            My properties
          </h1>
          <Button
              onClick={() =>
                  navigate('/landlord/properties/new')
              }
          >
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        </div>

        {properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start receiving bookings"
              actionLabel="Add property"
              onAction={() =>
                  navigate('/landlord/properties/new')}
            />
        ) : (
            <div className="grid grid-cols-1
                        md:grid-cols-2
                        xl:grid-cols-3 gap-5">
              {properties.map(property => (
                  <div
                      key={property.id}
                      className="card overflow-hidden p-0"
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-100
                              relative">
                      {property.primaryImageUrl ? (
                          <img
                              src={property.primaryImageUrl}
                              alt={property.title}
                              className="w-full h-full
                               object-cover"
                          />
                      ) : (
                          <div className="w-full h-full
                                  flex flex-col
                                  items-center
                                  justify-center
                                  text-gray-300">
                            <Building2 className="h-10 w-10 mb-1" />
                            <span className="text-xs">
                                No image
                            </span>
                          </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge status={property.status} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold
                               text-gray-900
                               text-sm mb-1
                               line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-xs text-gray-500
                              mb-3">
                        {property.city} ·{' '}
                        {property.bedrooms} bed ·{' '}
                        GHS {Number(property.price || 0).toLocaleString()}
                        /month
                      </p>

                      {/* Actions — reflows to two rows on
                          narrow cards so the delete button
                          never collides with the label. */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    `/landlord/properties/${property.id}/bookings`
                                )
                            }
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          Bookings
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    `/landlord/properties/${property.id}/edit`
                                )
                            }
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    `/properties/${property.id}`
                                )
                            }
                        >
                          <Image className="h-3.5 w-3.5" />
                          View
                        </Button>

                        <Button
                            variant="danger"
                            size="sm"
                            loading={deleting === property.id}
                            onClick={() =>
                                setPropertyPendingDelete(property)
                            }
                            aria-label={`Delete ${property.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {/* ── Delete confirmation ───────────────────── */}
        <ConfirmDialog
          open={!!propertyPendingDelete}
          title="Delete this property?"
          message={
            propertyPendingDelete
                ? `"${propertyPendingDelete.title}" will be ` +
                  'permanently removed. Any active bookings ' +
                  'will need to be cancelled separately.'
                : ''
          }
          confirmLabel="Delete property"
          cancelLabel="Keep property"
          variant="danger"
          loading={
            deleting === propertyPendingDelete?.id
          }
          onConfirm={() =>
              propertyPendingDelete &&
              performDelete(propertyPendingDelete.id)
          }
          onCancel={() => setPropertyPendingDelete(null)}
        />
      </div>
  )
}
