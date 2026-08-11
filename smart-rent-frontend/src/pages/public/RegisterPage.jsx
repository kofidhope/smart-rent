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
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-brand-green rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                SR
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Join SmartRent and find your perfect home
            </p>
          </div>

          {/* Card */}
          <div className="card">

            {/* Role notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 mb-4">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-blue-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-xs text-blue-700">
                All accounts start as{' '}
                <strong>Tenant</strong>.
                To become a landlord contact support
                after registering.
              </p>
            </div>

            {/* Error */}
            <ErrorMessage message={error} className="mb-4"/>

            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
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
                    className="absolute right-3 top-[34px]
                           text-gray-400
                           hover:text-gray-600
                           transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    className="absolute right-3 top-[34px]
                           text-gray-400
                           hover:text-gray-600
                           transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength hints */}
              <div className="text-xs text-gray-400 space-y-1 -mt-2">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li className={password?.length >= 8 ? 'text-green-500' : ''}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password || '') ? 'text-green-500' : ''}>
                    One uppercase letter
                  </li>
                  <li className={
                    /[a-z]/.test(password || '') ? 'text-green-500' : ''}>
                    One lowercase letter
                  </li>
                  <li className={/\d/.test(password || '') ? 'text-green-500'                       : ''}>
                    One number
                  </li>
                </ul>
              </div>

              {/* Terms notice */}
              <p className="text-xs text-gray-400 pt-1">
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
              >
                Create account
              </Button>

            </form>

            {/* ── Social register placeholder ──────────────
              Same as login — disabled until OAuth is set up
              When implemented use same Google/Facebook
              buttons but call /api/auth/google-register
              ─────────────────────────────────────────── */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0
                              flex items-center">
                  <div className="w-full border-t
                                border-gray-200" />
                </div>
                <div className="relative flex
                              justify-center text-sm">
                <span className="px-3 bg-white
                                 text-gray-400">
                  or register with
                </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">

                <button
                    type="button"
                    disabled
                    className="flex items-center
                           justify-center gap-2
                           px-4 py-2.5 rounded-lg
                           border border-gray-300
                           bg-white text-sm
                           font-medium text-gray-400
                           cursor-not-allowed opacity-60"
                    title="Coming soon"
                >
                  <svg className="h-4 w-4"
                       viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>

                <button
                    type="button"
                    disabled
                    className="flex items-center
                           justify-center gap-2
                           px-4 py-2.5 rounded-lg
                           border border-gray-300
                           bg-white text-sm
                           font-medium text-gray-400
                           cursor-not-allowed opacity-60"
                    title="Coming soon"
                >
                  <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="#1877F2"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>

              </div>

              <p className="text-center text-xs
                          text-gray-400 mt-3">
                Social login coming soon
              </p>
            </div>

            {/* Login link */}
            <p className="text-center text-sm
                        text-gray-500 mt-6">
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