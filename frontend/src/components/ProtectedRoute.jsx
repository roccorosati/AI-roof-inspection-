import { Navigate } from 'react-router-dom';

function getCookie(name) {
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];
}

export default function ProtectedRoute({ children }) {
  return getCookie('loggedIn') === '1' ? children : <Navigate to="/login" replace />;
}
