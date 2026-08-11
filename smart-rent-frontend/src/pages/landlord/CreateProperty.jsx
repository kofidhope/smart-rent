import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Upload, X, Loader2 } from 'lucide-react'
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

// 5MB — Cloudinary free tier + browser upload budget
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGES = 10

// Per-image upload state for the thumbnail strip
const STATUS_PENDING   = 'pending'    // queued for upload
const STATUS_UPLOADING = 'uploading'  // in-flight
const STATUS_DONE      = 'done'       // uploaded
const STATUS_FAILED    = 'failed'     // rejected by API

// Lightweight label/error wrapper used for the
// textarea and select controls in this form so they
// stay visually consistent with the <Input> component.
function FormField({ label, required, error, htmlFor, children }) {
    return (
        <div className="w-full">
            <label htmlFor={htmlFor}
                   className={`label ${required ? 'label-required' : ''}`}>
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" className="error-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger-icon flex-shrink-0 mt-0.5" />
                    {error}
                </p>
            )}
        </div>
    )
}

export default function CreateProperty() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    // Each entry: { file, status, error? }
    const [imageEntries, setImageEntries] = useState([])
    const imagePreviewUrls = useMemo(
        () => imageEntries.map((e) => URL.createObjectURL(e.file)),
        [imageEntries]
    )

    useEffect(() => {
        return () => {
            imagePreviewUrls.forEach((url) =>
                URL.revokeObjectURL(url))
        }
    }, [imagePreviewUrls])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: 'onBlur',
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

        if (imageEntries.length === 0) {
            setError('Please add at least one property photo')
            toast.error('At least one photo is required')
            return
        }

        setLoading(true)

        try {
            const property = await PropertyService.create({
                ...data,
                price: Number(data.price),
                bedrooms: Number(data.bedrooms),
                bathrooms: Number(data.bathrooms),
            })

            // Upload sequentially so the user can see each
            // thumbnail flip from uploading → done. One
            // failure doesn't abort the rest.
            let okCount = 0
            for (let i = 0; i < imageEntries.length; i++) {
                const entry = imageEntries[i]
                setImageEntries(prev => prev.map((e, j) =>
                    j === i
                        ? { ...e, status: STATUS_UPLOADING }
                        : e
                ))
                try {
                    await PropertyService.uploadImage(
                        property.id, entry.file)
                    setImageEntries(prev => prev.map((e, j) =>
                        j === i
                            ? { ...e, status: STATUS_DONE }
                            : e
                    ))
                    okCount += 1
                } catch (uploadErr) {
                    setImageEntries(prev => prev.map((e, j) =>
                        j === i
                            ? {
                                ...e,
                                status: STATUS_FAILED,
                                error: uploadErr.message,
                            }
                            : e
                    ))
                    toast.error(
                        uploadErr.message || 'One photo failed to upload')
                }
            }

            if (okCount === 0) {
                setError(
                    'Property was created but photo upload ' +
                    'failed. Edit the property and add photos.')
                toast.error('Photo upload failed')
                navigate('/landlord/properties')
                return
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
        // Reset the input so picking the same file twice
        // still triggers onChange.
        e.target.value = ''

        if (imageEntries.length + files.length > MAX_IMAGES) {
            toast.error(`Maximum ${MAX_IMAGES} images allowed`)
            return
        }

        const accepted = []
        for (const file of files) {
            if (file.size > MAX_IMAGE_BYTES) {
                toast.error(
                    `${file.name} exceeds 5MB and was skipped`)
                continue
            }
            if (!file.type.startsWith('image/')) {
                toast.error(
                    `${file.name} is not an image and was skipped`)
                continue
            }
            accepted.push({
                file,
                status: STATUS_PENDING,
            })
        }

        if (accepted.length) {
            setImageEntries(prev => [...prev, ...accepted])
        }
    }

    const removeImage = (index) => {
        setImageEntries(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="page-container max-w-2xl">

            <h1 className="page-title">Add new property</h1>

            <ErrorMessage message={error} className="mb-6"/>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
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

                    <FormField
                        label="Description"
                        htmlFor="description"
                        required
                        error={errors.description?.message}
                    >
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Describe your property — amenities, nearby places, rules..."
                            aria-invalid={
                              errors.description ? 'true' : 'false'}
                            className={`input resize-none ${
                                errors.description
                                    ? 'input-error' : ''
                            }`}
                            {...register('description', {
                                required: 'Description is required',
                                minLength: {
                                    value: 20,
                                    message: 'At least 20 characters',
                                },
                            })}
                        />
                    </FormField>

                    <FormField
                        label="Property type"
                        htmlFor="type"
                        required
                    >
                        <select
                            id="type"
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
                    </FormField>
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
                        <FormField
                            label="Bedrooms"
                            htmlFor="bedrooms"
                        >
                            <select
                                id="bedrooms"
                                className="input"
                                {...register('bedrooms')}
                            >
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <option key={n} value={n}>
                                        {n} {n === 1
                                            ? 'bedroom'
                                            : 'bedrooms'}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <FormField
                            label="Bathrooms"
                            htmlFor="bathrooms"
                        >
                            <select
                                id="bathrooms"
                                className="input"
                                {...register('bathrooms')}
                            >
                                {[1, 2, 3, 4].map(n => (
                                    <option key={n} value={n}>
                                        {n} {n === 1
                                            ? 'bathroom'
                                            : 'bathrooms'}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                </div>

                {/* Images */}
                <div className="card space-y-4">
                    <h2 className="section-title">
                        Photos
                        <span className="text-sm font-normal text-red-500 ml-2">
                            (required, max 10)
                        </span>
                    </h2>

                    {/* Upload area */}
                    <label className={`block border-2 border-dashed rounded-xl
                            p-6 text-center cursor-pointer
                            hover:border-brand-green
                            hover:bg-brand-light/20
                            transition-colors ${
                                imageEntries.length === 0
                                    ? 'border-red-200'
                                    : 'border-gray-200'
                            }`}>
                        <Upload className="h-8 w-8 text-gray-300
                               mx-auto mb-2"/>
                        <p className="text-sm text-gray-500">
                            Click to upload photos
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG or WebP, max 5MB each.
                            At least 1 required.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                    </label>
                    {imageEntries.length === 0 && (
                        <p className="error-text">
                            At least one photo is required
                        </p>
                    )}

                    {/* Selected images preview */}
                    {imageEntries.length > 0 && (
                        <div className="grid grid-cols-3
                            sm:grid-cols-4 gap-3">
                            {imageEntries.map((entry, i) => {
                                const isUploading =
                                  entry.status === STATUS_UPLOADING
                                const isFailed =
                                  entry.status === STATUS_FAILED
                                return (
                                    <div
                                        key={`${entry.file.name}-${i}`}
                                        className={`relative group
                                            rounded-lg overflow-hidden
                                            aspect-square border ${
                                              isFailed
                                                ? 'border-danger-border bg-danger-bg'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={imagePreviewUrls[i]}
                                            alt=""
                                            className={`w-full h-full
                                                object-cover ${
                                                  isUploading
                                                    ? 'opacity-60'
                                                    : ''
                                                }`}
                                        />

                                        {/* Uploading overlay */}
                                        {isUploading && (
                                            <div className="absolute
                                                inset-0 flex
                                                items-center justify-center
                                                bg-black/30">
                                                <Loader2 className="h-6 w-6
                                                    text-white
                                                    animate-spin"/>
                                            </div>
                                        )}

                                        {/* Remove button — hidden while
                                            an upload is in flight so the
                                            user can't yank a file out
                                            mid-upload */}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            disabled={isUploading}
                                            className="absolute top-1 right-1
                                                w-5 h-5 bg-red-500
                                                rounded-full flex items-center
                                                justify-center text-white
                                                opacity-0 group-hover:opacity-100
                                                disabled:opacity-30
                                                disabled:cursor-not-allowed
                                                transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3"/>
                                        </button>

                                        {/* Primary badge */}
                                        {i === 0 && (
                                            <div className="absolute bottom-1
                                                left-1 text-xs
                                                bg-brand-green
                                                text-white px-1.5
                                                py-0.5 rounded">
                                                Primary
                                            </div>
                                        )}

                                        {/* Failed badge */}
                                        {isFailed && (
                                            <div className="absolute
                                                bottom-1 right-1 text-xs
                                                bg-danger-border text-white
                                                px-1.5 py-0.5 rounded">
                                                Failed
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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
                        loading={loading}
                        fullWidth
                    >
                        {loading
                            ? 'Creating...'
                            : 'Create property'}
                    </Button>
                </div>

            </form>
        </div>
    )
}
