import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ErrorMessage from '../../components/ui/ErrorMessage'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Where to redirect after login
  // If user was trying to access a protected page
  // before being redirected to login we send them back
  const from = location.state?.from || null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async ({ email, password }) => {
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)

      toast.success(`Welcome back, ${user.firstName}!`)

      const roleHome =
        user.role === 'LANDLORD'
          ? '/landlord/dashboard'
          : user.role === 'ADMIN'
            ? '/admin/dashboard'
            : '/tenant/dashboard'

      // Only honor saved "from" paths that this role can access
      const canReturnToFrom =
        from &&
        (from === '/' ||
          from.startsWith('/properties') ||
          (user.role === 'TENANT' && from.startsWith('/tenant')) ||
          (user.role === 'LANDLORD' && from.startsWith('/landlord')) ||
          (user.role === 'ADMIN' && from.startsWith('/admin')))

      navigate(canReturnToFrom ? from : roleHome, { replace: true })

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
              Welcome back
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Sign in to your SmartRent account
            </p>
          </div>

          {/* Card */}
          <div className="card p-6 sm:p-8">

            {/* Error message */}
            <ErrorMessage message={error} className="mb-5" />

            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
            >

              {/* Email */}
              <Input
                  label="Email address"
                  type="email"
                  placeholder="kofi@example.com"
                  leftIcon={Mail}
                  error={errors.email?.message}
                  helper="We'll use this to notify you about bookings and payments"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
              />

              {/* Password */}
              <div className="relative">
                <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    leftIcon={Lock}
                    error={errors.password?.message}
                    helper="Use at least 8 characters for strong security"
                    className="pr-10"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
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

              {/* Submit */}
              <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="lg"
                  className="mt-2"
              >
                Sign in
              </Button>

            </form>

            {/* ── Social login placeholder ─────────────
              Quieter divider + dimmed buttons so the
              real form remains the visual lead.
            ─────────────────────────────────────────── */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-meta uppercase
                               tracking-[0.18em] text-gray-400">
                    Coming soon
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">

                {/* Google — coming soon */}
                <button
                    type="button"
                    disabled
                    className="flex items-center justify-center
                           gap-2 px-4 py-2.5 rounded-btn
                           border border-gray-200
                           bg-gray-50 text-sm font-medium
                           text-gray-400 cursor-not-allowed"
                    title="Coming soon"
                >
                  <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24">
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

                {/* Facebook — coming soon */}
                <button
                    type="button"
                    disabled
                    className="flex items-center justify-center
                           gap-2 px-4 py-2.5 rounded-btn
                           border border-gray-200
                           bg-gray-50 text-sm font-medium
                           text-gray-400 cursor-not-allowed"
                    title="Coming soon"
                >
                  <svg
                      className="h-4 w-4 opacity-60"
                      viewBox="0 0 24 24"
                      fill="#1877F2"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>

              </div>
            </div>

            {/* Register link */}
            <p className="text-center text-sm
                        text-gray-500 mt-8">
              Don't have an account?{' '}
              <Link
                  to="/register"
                  className="font-medium text-brand-green
                         hover:text-brand-dark
                         transition-colors"
              >
                Create one free
              </Link>
            </p>

          </div>

        </div>
      </div>
  )
}
