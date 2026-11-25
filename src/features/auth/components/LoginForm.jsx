import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { ArrowRight, Phone, TriangleAlert, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../../../components/ui/Loader.jsx'
import { cn } from '../../../utils/helpers.js'
import { FALLBACK_PATH, OTP_LENGTH, RESEND_SECONDS } from '../constants.js'
import { useAuth } from '../hooks/useAuth.js'
import { otpPhoneSchema, passwordLoginSchema } from '../validation/loginSchema.js'
import LoginTypeSelector from './LoginTypeSelector.jsx'
import OtpBoxes from './OtpBoxes.jsx'
import StyledField from './StyledField.jsx'
import StyledPasswordField from './StyledPasswordField.jsx'
import VersionModal from './VersionModal.jsx'

export default function LoginForm({
  theme,
  versionType,
  onChangeVersion,
  version,
  versionReady,
  versionStatus,
  versionError,
  onRetryVersion,
}) {
  const { loginWithPassword, sendLoginOtp, loginWithOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('password')
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionMessage, setVersionMessage] = useState('')
  const [apiError, setApiError] = useState('')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpErrors, setOtpErrors] = useState({})
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const {
    register,
    handleSubmit,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { account: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const redirectTarget = (() => {
    const from = location.state?.from
    if (!from?.pathname || from.pathname === '/login') return FALLBACK_PATH
    return `${from.pathname}${from.search || ''}`
  })()

  const busy = isSubmitting || sending || verifying

  const showVersionModal = (message) => {
    setVersionMessage(
      message || 'This app version is outdated. Please update to continue.',
    )
    setVersionModalOpen(true)
  }

  const resetOtpFlow = () => {
    setOtpSent(false)
    setOtp('')
    setOtpErrors({})
    setPhone('')
    setResendIn(0)
    setApiError('')
  }

  const handleTypeChange = (value) => {
    if (value === versionType || busy) return
    onChangeVersion(value)
    resetOtpFlow()
    setVersionModalOpen(false)
    clearErrors()
  }

  const onSubmit = async ({ account, password }) => {
    if (!version) return
    setApiError('')

    try {
      await loginWithPassword(account.trim(), password, version)
      toast.success('Welcome back.')
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      if (error?.isVersionMismatch) {
        showVersionModal(error.message)
        return
      }
      setApiError(error?.message || 'Login failed')
      setFocus('password')
    }
  }

  const handleSendOtp = async () => {
    if (!version) return

    const normalizedPhone = phone.trim()
    const nextErrors = {}
    if (!normalizedPhone) {
      nextErrors.phone = "Owner's mobile number is required"
    } else {
      const parsed = otpPhoneSchema.safeParse({ phone: normalizedPhone })
      if (!parsed.success) {
        nextErrors.phone = parsed.error.issues[0]?.message
      }
    }

    setOtpErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setApiError('')
    try {
      setSending(true)
      await sendLoginOtp(normalizedPhone, version)
      setOtpSent(true)
      setResendIn(RESEND_SECONDS)
      setOtp('')
      setOtpErrors({})
      toast.success('OTP sent')
    } catch (error) {
      if (error?.isVersionMismatch) {
        showVersionModal(error.message)
        return
      }
      setApiError(error?.message || 'Could not send OTP')
    } finally {
      setSending(false)
    }
  }

  const verifyOtp = async (code) => {
    if (!version || verifying) return
    if (code.length !== OTP_LENGTH) {
      setOtpErrors({ otp: 'Enter the 6-digit OTP' })
      return
    }

    setApiError('')
    try {
      setVerifying(true)
      await loginWithOtp(phone.trim(), code, version)
      toast.success('Welcome back.')
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      if (error?.isVersionMismatch) {
        showVersionModal(error.message)
        return
      }
      setApiError(error?.message || 'Login failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleOtpChange = (value) => {
    setOtp(value)
    setOtpErrors({})
    setApiError('')
    if (value.length === OTP_LENGTH) verifyOtp(value)
  }

  const tabClass = (active) =>
    cn(
      'flex min-h-[40px] items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold leading-tight transition-all sm:text-sm',
      active ? theme.tabActive : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 hover:text-black dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white',
    )

  const primaryBtn = cn(
    'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    theme.btn,
  )

  return (
    <>
      <LoginTypeSelector
        value={versionType}
        onChange={handleTypeChange}
        disabled={busy}
        status={versionStatus}
        error={versionError}
        onRetry={onRetryVersion}
      />

      <div
        role="tablist"
        className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'password'}
          onClick={() => {
            setMode('password')
            setApiError('')
          }}
          className={tabClass(mode === 'password')}
        >
          Account Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'otp'}
          onClick={() => {
            setMode('otp')
            setApiError('')
          }}
          className={tabClass(mode === 'otp')}
        >
          OTP Login
        </button>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 p-3 text-sm font-medium text-red-700"
        >
          {apiError}
        </div>
      )}

      {mode === 'password' ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <StyledField
            id="login-account"
            label="Account"
            icon={User}
            theme={theme}
            type="text"
            autoComplete="username"
            autoFocus
            placeholder="Enter your account"
            error={errors.account?.message}
            disabled={isSubmitting || !versionReady}
            {...register('account', { setValueAs: (value) => value.trim() })}
          />

          <div>
            <StyledPasswordField
              id="login-password"
              label="Password"
              theme={theme}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              disabled={isSubmitting || !versionReady}
              onKeyUp={(event) =>
                setCapsLockOn(
                  Boolean(
                    event.getModifierState && event.getModifierState('CapsLock'),
                  ),
                )
              }
              {...register('password')}
            />
            {capsLockOn && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <TriangleAlert size={13} />
                Caps Lock is on
              </p>
            )}
            <div className="mt-2 text-right">
              <button
                type="button"
                className={cn('text-sm font-semibold hover:underline', theme.link)}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !versionReady}
            aria-busy={isSubmitting}
            className={primaryBtn}
          >
            {isSubmitting ? (
              <>
                <Loader />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <StyledField
            id="login-phone"
            label="Owner Mobile Number"
            icon={Phone}
            theme={theme}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Enter 10-digit number"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, ''))
              setOtpErrors((current) => ({ ...current, phone: undefined }))
            }}
            error={otpErrors.phone}
            disabled={otpSent || sending || !versionReady}
          />

          {otpSent ? (
            <>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-gray-800 dark:text-slate-100">Enter OTP</p>
                <OtpBoxes
                  theme={theme}
                  value={otp}
                  onChange={handleOtpChange}
                  error={otpErrors.otp}
                  disabled={verifying || !versionReady}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-slate-400">Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendIn > 0 || sending || !versionReady}
                  onClick={handleSendOtp}
                  className={cn(
                    'text-sm font-semibold focus-visible:outline-none',
                    resendIn > 0 ? 'cursor-not-allowed text-gray-400 dark:text-slate-500' : `${theme.link} hover:underline`,
                  )}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => verifyOtp(otp)}
                disabled={verifying || otp.length !== OTP_LENGTH || !versionReady}
                aria-busy={verifying}
                className={primaryBtn}
              >
                {verifying ? (
                  <>
                    <Loader />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify &amp; Login
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetOtpFlow}
                className="mx-auto block text-sm font-semibold text-gray-500 dark:text-slate-400 transition-colors hover:text-black"
              >
                Change number
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending || phone.length !== 10 || !versionReady}
              aria-busy={sending}
              className={primaryBtn}
            >
              {sending ? (
                <>
                  <Loader />
                  Sending…
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-300">
        Don't have an account?{' '}
        <button type="button" className={cn('font-bold hover:underline', theme.link)}>
          Sign Up
        </button>
      </p>

      <VersionModal
        open={versionModalOpen}
        message={versionMessage}
        theme={theme}
        onCancel={() => {
          setVersionModalOpen(false)
          navigate('/login', { replace: true })
        }}
        onUpdate={() => window.location.reload()}
      />
    </>
  )
}
