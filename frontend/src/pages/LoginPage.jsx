import { SignIn } from '@clerk/clerk-react';
import AuthHeader from '../components/AuthHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <AuthHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <SignIn
          routing="path"
          path="/login"
          afterSignInUrl="/app"
          signUpUrl="/signup"
        />
      </main>
      <AppFooter />
    </div>
  );
}
