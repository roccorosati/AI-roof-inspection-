import { RedirectToSignIn } from '@clerk/clerk-react';
import { useRequireAuth } from '../lib/auth.js';

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useRequireAuth();

  // Blank screen while Clerk hydrates — avoids flash of redirect
  if (!isLoaded) return <div style={{ minHeight: '100vh', background: '#f1f5f9' }} />;

  return isSignedIn ? children : <RedirectToSignIn />;
}
