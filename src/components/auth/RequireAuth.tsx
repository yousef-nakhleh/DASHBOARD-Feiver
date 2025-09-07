// src/components/auth/RequireAuth.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * RequireAuth
 * - Ensures a valid Supabase session exists
 * - Redirects unauthenticated users to /login
 * - While checking session → renders nothing (avoid flicker)
 */
export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}