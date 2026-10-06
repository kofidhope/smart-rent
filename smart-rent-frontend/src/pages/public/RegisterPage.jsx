import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {Mail, Lock, Eye, EyeOff, User, Phone,} from 'lucide-react'
import toast from 'react-hot-toast'
import AuthService from '../../services/auth.service'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ErrorMessage from '../../components/ui/ErrorMessage'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {register, handleSubmit, watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Watch password field so confirmPassword
  // validation can compare against it
  const password = watch('password')

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)

    try {
      await AuthService.register({
        firstName:   data.firstName,
        lastName:    data.lastName,
        email:       data.email,
        phoneNumber: data.phoneNumber,
        password:    data.password,
      })

      toast.success('Account created! Please sign in.')

      // Do not auto-login after register
      // User must log in manually
      // This is intentional — forces them through
      // the login flow which sets the httpOnly cookies
      navigate('/login', { replace: true })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-brand-green rounded-md
                          mx-auto mb-5 flex items-center justify-center">
              <span className="text-white font-bold text-lg tracking-tight">
                SR
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900
                       tracking-tight">
              Create your account
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Join SmartRent and find your perfect home
            </p>
          </div>

          {/* Card */}
          <div className="card p-6 sm:p-8">

            {/* Role notice — quieter, info-bg
                instead of a loud blue. */}
            <div className="flex items-start gap-3 p-4 rounded-btn
                          bg-info-bg border border-info-border
                          mb-6">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5
                            rounded-full bg-info-icon
                            flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-meta text-info-text leading-relaxed">
                All accounts start as <strong>Tenant</strong>.
                To become a landlord contact support
                after registering.
              </p>
            </div>

            {/* Error */}
            <ErrorMessage message={error} className="mb-5"/>

            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >

              {/* First and last name — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                    label="First name"
                    type="text"
                    placeholder="Kofi"
                    leftIcon={User}
                    error={errors.firstName?.message}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {value: 2, message: 'At least 2 characters',},
                      maxLength: {value: 50, message: 'At most 50 characters',},
                    })}
                />
                <Input
                    label="Last name"
                    type="text"
                    placeholder="Mensah"
                    error={errors.lastName?.message}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {value: 2, message: 'At least 2 characters',},
                      maxLength: {value: 50, message: 'At most 50 characters',},
                    })}
                />
              </div>

              {/* Email */}
              <Input
                  label="Email address"
                  type="email"
                  placeholder="kofi@example.com"
                  leftIcon={Mail}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
              />

              {/* Phone number */}
              <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+233244000000"
                  leftIcon={Phone}
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[0-9]{10,15}$/,
                      message:
                          'Enter a valid phone number ' +
                          '(e.g. +233244000000)',
                    },
                  })}
              />

              {/* Password */}
              <div className="relative">
                <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    leftIcon={Lock}
                    error={errors.password?.message}
                    className="pr-10"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {value: 8,
                        message:
                            'Password must be at least ' +
                            '8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message:
                            'Must contain uppercase, ' +
                            'lowercase and a number',
                      },
                    })}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password'
                          : 'Show password'
                    }
                    className="absolute top-8 right-0 h-11
                           flex items-center pr-3
                           text-gray-400
                           hover:text-gray-600
                           transition-colors"
                >
                  {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm password */}
              <div className="relative">
                <Input
                    label="Confirm password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    leftIcon={Lock}
                    error={errors.confirmPassword?.message}
                    className="pr-10"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                          value === password ||
                          'Passwords do not match',
                    })}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={
                      showConfirm ? 'Hide password'
                          : 'Show password'
                    }
                    className="absolute top-8 right-0 h-11
                           flex items-center pr-3
                           text-gray-400
                           hover:text-gray-600
                           transition-colors"
                >
                  {showConfirm
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength hints — quietly
                  styled with check indicators. */}
              <div className="text-meta text-gray-500
                            space-y-1.5 -mt-1">
                <p>Password must contain:</p>
                <ul className="space-y-1">
                  {[
                    { ok: (password?.length || 0) >= 8,
                      label: 'At least 8 characters' },
                    { ok: /[A-Z]/.test(password || ''),
                      label: 'One uppercase letter' },
                    { ok: /[a-z]/.test(password || ''),
                      label: 'One lowercase letter' },
                    { ok: /\d/.test(password || ''),
                      label: 'One number' },
                  ].map(({ ok, label }) => (
                    <li key={label}
                        className={`flex items-center gap-2
                                   ${ok
                                     ? 'text-success-text'
                                     : 'text-gray-400'}`}>
                      <span className={`w-1 h-1 rounded-full
                                       ${ok
                                         ? 'bg-success-icon'
                                         : 'bg-gray-300'}`}/>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Terms notice */}
              <p className="text-meta text-gray-500 pt-1">
                By creating an account you agree to our{' '}
                <span className="text-brand-green
                               cursor-pointer
                               hover:underline">
                Terms of Service
              </span>{' '}
                and{' '}
                <span className="text-brand-green
                               cursor-pointer
                               hover:underline">
                Privacy Policy
              </span>
                .
              </p>

              {/* Submit */}
              <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="lg"
              >
                Create account
              </Button>

            </form>

            {/* Login link */}
            <p className="text-center text-sm
                        text-gray-500 mt-8">
              Already have an account?{' '}
              <Link
                  to="/login"
                  className="font-medium text-brand-green
                         hover:text-brand-dark
                         transition-colors"
              >
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>
  )
}
