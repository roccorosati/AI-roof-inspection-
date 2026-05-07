import { useAuth } from '@clerk/clerk-react';
import AppHeader from './AppHeader.jsx';
import MarketingNav from './MarketingNav.jsx';

export default function SmartNav() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  return isSignedIn ? <AppHeader /> : <MarketingNav />;
}
