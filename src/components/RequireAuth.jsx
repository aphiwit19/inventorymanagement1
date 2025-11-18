import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';

export default function RequireAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location]);

  const user = getCurrentUser();
  if (!user) return null;
  return children;
}
