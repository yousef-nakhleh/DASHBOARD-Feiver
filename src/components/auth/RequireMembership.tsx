import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/**
 * RequireMembership
 * -------------------------------------------------
 * Route guard that ensures the signed-in user has at least
 * one membership row (optionally with an allowed role and/or
 * a specific business_id). If the requirement isn't met,
 * redirects to a fallback route.
 */
export type RequireMembershipProps = {
  children: React.ReactNode
  /**
   * If provided, at least one membership must match one of these roles.
   * Example: ['owner', 'admin']
   */
  allowedRoles?: string[]
  /**
   * If provided, the user must have membership for this business.
   */
  requireBusinessId?: string
  /**
   * Where to send users who are missing membership/role.
   * Defaults to '/auth/no-membership'.
   */
  fallbackPath?: string
  /**
   * Optional: show a minimal built-in loading UI while checking.
   */
  showLoading?: boolean
}

export type Membership = {
  id: string
  user_id: string
  business_id: string
  role: string
}

export default function RequireMembership({
  children,
  allowedRoles,
  requireBusinessId,
  fallbackPath = '/auth/no-membership',
  showLoading = true,
}: RequireMembershipProps) {
  const { supabase, user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Build query filters once
  const filters = useMemo(() => ({
    roleList: allowedRoles && allowedRoles.length > 0 ? allowedRoles : null,
    requiredBiz: requireBusinessId ?? null,
  }), [allowedRoles, requireBusinessId])

  useEffect(() => {
    let active = true

    const run = async () => {
      if (authLoading) return

      // Not signed in at all
      if (!user) {
        setChecking(false)
        // Redirect to invite/login, preserving where we wanted to go
        navigate(`/auth/invite?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true })
        return
      }

      setChecking(true)
      setError(null)

      try {
        let query = supabase.from('memberships')
          .select('id, user_id, business_id, role')
          .eq('user_id', user.id)

        if (filters.requiredBiz) {
          query = query.eq('business_id', filters.requiredBiz)
        }

        if (filters.roleList) {
          query = query.in('role', filters.roleList)
        }

        const { data, error } = await query
        if (error) throw error

        const memberships = (data as Membership[]) || []
        const ok = memberships.length > 0
        if (!active) return
        setHasAccess(ok)

        if (!ok) {
          // No membership that satisfies requirement → redirect
          navigate(fallbackPath, { replace: true })
        }
      } catch (e: any) {
        if (!active) return
        setError(e?.message ?? 'Failed to verify membership')
        navigate(fallbackPath, { replace: true })
      } finally {
        if (active) setChecking(false)
      }
    }

    run()
    return () => { active = false }
  }, [authLoading, user, supabase, filters, fallbackPath, navigate, location])

  if ((authLoading || checking) && showLoading) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="text-sm opacity-70">Checking access…</div>
      </div>
    )
  }

  if (error && showLoading) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Access error</h2>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    )
  }

  return hasAccess ? <>{children}</> : null
}

/**
 * Example usage:
 *
 * <Route
 *   path="/dashboard"
 *   element={
 *     <RequireMembership allowedRoles={["owner", "admin"]}>
 *       <Dashboard />
 *     </RequireMembership>
 *   }
 * />
 */
