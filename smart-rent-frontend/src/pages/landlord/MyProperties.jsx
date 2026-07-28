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

export default function MyProperties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await PropertyService
          .getMyProperties()
      setProperties(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm(
        'Delete this property? This cannot be undone.'
    )) return

    setDeleting(id)
    try {
      await PropertyService.delete(id)
      toast.success('Property deleted')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(null)
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
                      justify-between mb-6">
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
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-gray-200
                                 mx-auto mb-4" />
              <h3 className="text-lg font-semibold
                         text-gray-900 mb-2">
                No properties yet
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Add your first property to start receiving
                bookings
              </p>
              <Button
                  onClick={() =>
                      navigate('/landlord/properties/new')
                  }
              >
                <Plus className="h-4 w-4" />
                Add property
              </Button>
            </div>
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
                    <div className="h-40 bg-gray-100
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
                        GHS {property.price.toLocaleString()}
                        /month
                      </p>

                      {/* Actions */}
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
                                handleDelete(property.id)
                            }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  )
}