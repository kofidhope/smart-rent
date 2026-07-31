import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PropertyService from '../../services/property.service'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'VILLA',
  'OFFICE',
]

export default function EditProperty() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      address: '',
      city: '',
      price: '',
      type: 'APARTMENT',
      bedrooms: 1,
      bathrooms: 1,
      status: 'AVAILABLE',
    },
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const property = await PropertyService.getById(id)
        reset({
          title: property.title || '',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          price: property.price ?? '',
          type: property.type || 'APARTMENT',
          bedrooms: property.bedrooms ?? 1,
          bathrooms: property.bathrooms ?? 1,
          status: property.status || 'AVAILABLE',
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, reset])

  const onSubmit = async (data) => {
    setError('')
    setSaving(true)
    try {
      await PropertyService.update(id, {
        ...data,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
      })
      toast.success('Property updated successfully!')
      navigate('/landlord/properties')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title">Edit property</h1>
      <ErrorMessage message={error} className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="section-title">Basic information</h2>

          <Input
            label="Property title"
            placeholder="e.g. Modern 2-Bedroom in East Legon"
            error={errors.title?.message}
            {...register('title', {
              required: 'Title is required',
              minLength: {
                value: 5,
                message: 'At least 5 characters',
              },
            })}
          />

          <div>
            <label className="label">Description</label>
            <textarea
              rows={4}
              placeholder="Describe your property — amenities, nearby places, rules..."
              className={`input resize-none ${
                errors.description ? 'input-error' : ''
              }`}
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'At least 20 characters',
                },
              })}
            />
            {errors.description && (
              <p className="error-text">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="label">Property type</label>
            <select
              className="input"
              {...register('type', { required: true })}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="section-title">Location</h2>

          <Input
            label="Full address"
            placeholder="e.g. 14 Boundary Road, East Legon"
            error={errors.address?.message}
            {...register('address', {
              required: 'Address is required',
            })}
          />

          <Input
            label="City"
            placeholder="e.g. Accra"
            error={errors.city?.message}
            {...register('city', {
              required: 'City is required',
            })}
          />
        </div>

        <div className="card space-y-4">
          <h2 className="section-title">Details</h2>

          <Input
            label="Monthly rent (GHS)"
            type="number"
            placeholder="e.g. 2500"
            error={errors.price?.message}
            {...register('price', {
              required: 'Price is required',
              min: {
                value: 1,
                message: 'Price must be greater than 0',
              },
            })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bedrooms</label>
              <select className="input" {...register('bedrooms')}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'bedroom' : 'bedrooms'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <select className="input" {...register('bathrooms')}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'bathroom' : 'bathrooms'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/landlord/properties')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} fullWidth>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
