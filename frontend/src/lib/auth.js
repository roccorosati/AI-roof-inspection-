import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback } from 'react';

// Returns the current Clerk user object + loaded state.
export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  return { user, isLoaded };
}

// Returns sign-in state. Use in ProtectedRoute.
export function useRequireAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  return { isSignedIn, isLoaded };
}

// Drop-in replacement for fetch() that automatically attaches the Clerk
// Bearer token. All auth'd API calls must go through this hook — never
// call fetch() with credentials or tokens directly.
export function useAuthFetch() {
  const { getToken } = useAuth();

  return useCallback(async (url, options = {}) => {
    const token = await getToken();
    const headers = { ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }, [getToken]);
}
