import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Home from '../pages/customer/Home';
import Products from '../pages/customer/Products';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import OrderSuccess from '../pages/customer/OrderSuccess';
import Orders from '../pages/customer/Orders';
import OrderDetail from '../pages/customer/OrderDetail';
import Profile from '../pages/customer/Profile';
import RequireAuth from '../components/RequireAuth';
import RequireRole from '../components/RequireRole';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminOrders from '../pages/admin/Orders';
import AdminProducts from '../pages/admin/Products';
import AdminOrderDetail from '../pages/admin/OrderDetail';
import AdminStock from '../pages/admin/Stock';
import AdminUsers from '../pages/admin/Users';
import AdminNotifications from '../pages/admin/Notifications';
import AdminProfile from '../pages/admin/Profile';
import StaffLayout from '../layouts/StaffLayout';
import StaffDashboard from '../pages/staff/Dashboard';
import StaffQueue from '../pages/staff/Queue';
import StaffPrepareOrder from '../pages/staff/PrepareOrder';
import StaffMyTasks from '../pages/staff/MyTasks';
import StaffRequisitions from '../pages/staff/Requisitions';
import StaffProfile from '../pages/staff/Profile';
import AdminRequisitions from '../pages/admin/Requisitions';
import AdminRequisitionDetail from '../pages/admin/RequisitionDetail';
import { getCurrentUser } from '../services/auth';

function RoleAwareHome() {
  const user = getCurrentUser();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'staff') {
    return <Navigate to="/staff" replace />;
  }
  return <Home />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Customer */}
        <Route element={<CustomerLayout />}>          
          <Route path="/" element={<RoleAwareHome />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Admin */}
        <Route element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/stock" element={<AdminStock />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/requisitions" element={<AdminRequisitions />} />
          <Route path="/admin/requisitions/:id" element={<AdminRequisitionDetail />} />
        </Route>

        {/* Staff */}
        <Route element={<RequireRole roles={["admin","staff"]}><StaffLayout /></RequireRole>}>
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/queue" element={<StaffQueue />} />
          <Route path="/staff/order/:id" element={<StaffPrepareOrder />} />
          <Route path="/staff/my" element={<StaffMyTasks />} />
          <Route path="/staff/requisitions" element={<StaffRequisitions />} />
          <Route path="/staff/profile" element={<StaffProfile />} />
          {/** manual new requisition is deprecated */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
