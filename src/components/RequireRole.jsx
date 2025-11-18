import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';

export default function RequireRole({ role, roles, children }) {
  const user = getCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  const allowed = roles ? Array.isArray(roles) && roles.includes(user.role) : (role ? user.role === role : true);
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}
