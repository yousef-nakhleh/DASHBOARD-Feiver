import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * AuthError Page
 * -------------------------------------------------
 * Displayed when an invite/confirmation/reset link is invalid
 * or expired, or when any authentication error occurs.
 *
 * Responsibilities:
 *  - Show a clear error message to the user.
 *  - Provide actions to recover: request new invite, reset password, or go home.
 */
export default function AuthError() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Read optional error code/message from query params (e.g. ?error=expired)
  const errorCode = params.get('error')
  const errorMessage = params.get('message')

  const title = errorCode === 'expired'
    ? 'Link expired'
    : errorCode === 'invalid'
      ? 'Link invalid'
      : 'Authentication error'

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-sm opacity-80 mb-6">
        {errorMessage || 'Your authentication link could not be verified. This may happen if it has already been used or has expired.'}
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/auth/request-invite')}
          className="w-full px-4 py-2 rounded-xl border text-sm"
        >
          Request new invite
        </button>
        <button
          onClick={() => navigate('/auth/reset')}
          className="w-full px-4 py-2 rounded-xl border text-sm"
        >
          Reset password
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full px-4 py-2 rounded-xl border text-sm"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
