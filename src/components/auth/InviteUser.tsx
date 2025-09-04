import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/**
 * InviteUser (SetPassword) page
 *
 * Purpose:
 *  - Landing page for Supabase invite links (ConfirmationURL)
 *  - Uses the temporary session contained in the URL to authenticate the user
 *  - Prompts the user to set a new password and (optionally) attach membership
 *  - Redirects to the dashboard on success
 */
export default function InviteUser() {
  const navigate = useNavigate()
  const { supabase, user, session, loading } = useAuth()
  const [params] = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Optional: capture business_id from a signed query param or state
  const businessId = useMemo(() => params.get('business_id') ?? undefined, [params])

  // Guard: if we already have a logged user with a password set, skip
  useEffect(() => {
    if (!loading && user && session) {
      // If this isn't an invite flow, but user is signed in, we can route away
      // Keep the invite flow if URL contains ?mode=invite or type=signup
      const mode = params.get('mode') || params.get('type')
      if (!mode || (mode !== 'invite' && mode !== 'signup')) {
        // Existing session not from invite; send to app
        // (Keep this simple; adjust to your router structure)
        // navigate('/dashboard', { replace: true })
      }
    }
  }, [loading, user, session, params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!session) {
      setError('Your invite link is missing or expired. Please request a new invite.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      // 1) Set password using the temporary session from invite link
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr

      // 2) Optionally attach membership via your API (recommended server-side)
      //    Do NOT trust business_id from the URL unless signed/validated server-side.
      //    Example (uncomment and replace with your endpoint):
      // if (businessId) {
      //   const res = await fetch('/api/attach-membership', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     credentials: 'include',
      //     body: JSON.stringify({ business_id: businessId }),
      //   })
      //   if (!res.ok) {
      //     const { message } = await res.json().catch(() => ({ message: 'Failed to attach membership' }))
      //     throw new Error(message)
      //   }
      // }

      setSuccess(true)
      // 3) Route to dashboard (or your next step)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while setting your password.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm opacity-70">Loading…</div>
      </div>
    )
  }

  // If no session after loading, the invite link is invalid/expired
  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Invite link invalid or expired</h1>
        <p className="text-sm opacity-80 mb-6">
          Your invite link could not be verified. Please request a new invitation or use password reset.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/auth/request-invite')}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            Request new invite
          </button>
          <button
            onClick={() => navigate('/auth/reset')}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            Reset password
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Set your password</h1>
      <p className="text-sm opacity-80 mt-1 mb-6">
        Welcome{user?.email ? `, ${user.email}` : ''}! Create a password to complete your account.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm mb-1">New password</label>
          <input
            id="password"
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            minLength={8}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm mb-1">Confirm password</label>
          <input
            id="confirm"
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl px-4 py-2 border text-sm disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save password'}
        </button>

        {success && (
          <p className="text-xs opacity-70">Password saved. Redirecting…</p>
        )}
      </form>

      {/* Optional helper / debug info */}
      <div className="mt-6 text-xs opacity-70 space-y-1">
        <div>Invite mode: {params.get('mode') || params.get('type') || 'n/a'}</div>
        {businessId && <div>Business: {businessId}</div>}
      </div>
    </div>
  )
}
