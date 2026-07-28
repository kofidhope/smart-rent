import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Upload, X, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import PropertyService from '../../services/property.service'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ErrorMessage from '../../components/ui/ErrorMessage'

const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'VILLA',
  'OFFICE',
]

export default function CreateProperty() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  const {
    register,
    handleSubmit,
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
    },
  })

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)

    try {
      const property = await PropertyService.create({
        ...data,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
      })

      setCreatedId(property.id)

      // Upload images if any were selected
      if (images.length > 0) {
        setUploading(true)
        for (const file of images) {
          try {
            await PropertyService.uploadImage(
                property.id,
                file
            )
          } catch {
            // Continue even if one image fails
          }
        }
        setUploading(false)
      }

      toast.success('Property created successfully!')
      navigate('/landlord/properties')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    setImages(prev => [...prev, ...files])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
      <div className="page-container max-w-2xl">

        <h1 className="page-title">Add new property</h1>

        <ErrorMessage message={error} className="mb-6" />

        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
        >

          {/* Basic info */}
          <div className="card space-y-4">
            <h2 className="section-title">
              Basic information
            </h2>

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
                  <p className="error-text">
                    {errors.description.message}
                  </p>
              )}
            </div>

            <div>
              <label className="label">
                Property type
              </label>
              <select
                  className="input"
                  {...register('type', {
                    required: true,
                  })}
              >
                {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0) +
                          type.slice(1).toLowerCase()}
                    </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
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

          {/* Details */}
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
                <select
                    className="input"
                    {...register('bedrooms')}
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'bedroom' : 'bedrooms'}
                      </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <select
                    className="input"
                    {...register('bathrooms')}
                >
                  {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'bathroom' : 'bathrooms'}
                      </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card space-y-4">
            <h2 className="section-title">
              Photos
              <span className="text-sm font-normal
                             text-gray-400 ml-2">
              (optional, max 10)
            </span>
            </h2>

            {/* Upload area */}
            <label className="block border-2 border-dashed
                            border-gray-200 rounded-xl
                            p-6 text-center cursor-pointer
                            hover:border-brand-green
                            hover:bg-brand-light/20
                            transition-colors">
              <Upload className="h-8 w-8 text-gray-300
                               mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Click to upload photos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or WebP, max 5MB each
              </p>
              <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
              />
            </label>

            {/* Selected images preview */}
            {images.length > 0 && (
                <div className="grid grid-cols-3
                            sm:grid-cols-4 gap-3">
                  {images.map((file, i) => (
                      <div
                          key={i}
                          className="relative group
                             rounded-lg overflow-hidden
                             aspect-square"
                      >
                        <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="w-full h-full
                               object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1
                               w-5 h-5 bg-red-500
                               rounded-full flex items-center
                               justify-center text-white
                               opacity-0 group-hover:opacity-100
                               transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                            <div className="absolute bottom-1
                                    left-1 text-xs
                                    bg-brand-green
                                    text-white px-1.5
                                    py-0.5 rounded">
                              Primary
                            </div>
                        )}
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/landlord/properties')}
            >
              Cancel
            </Button>
            <Button
                type="submit"
                loading={loading || uploading}
                fullWidth
            >
              {uploading
                  ? 'Uploading images...'
                  : loading
                      ? 'Creating...'
                      : 'Create property'
              }
            </Button>
          </div>

        </form>
      </div>
  )
}