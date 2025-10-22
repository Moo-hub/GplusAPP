import lazyLoad from '../utils/lazyLoad';

// تحميل المكونات بشكل متأخر
const LoginScreen = lazyLoad(() => import('../screens/Auth/LoginScreen'));
const RegisterScreen = lazyLoad(() => import('../screens/Auth/RegisterScreen'));
const PointsScreen = lazyLoad(() => import('../screens/Points/PointsScreen'));
const CompaniesScreen = lazyLoad(() => import('../screens/Companies/CompaniesScreen'));
const VehiclesScreen = lazyLoad(() => import('../screens/Vehicles/VehiclesScreen'));
const PaymentsScreen = lazyLoad(() => import('../screens/Payments/PaymentsScreen'));
const RequestPickupScreen = lazyLoad(() => import('../screens/RequestPickup/RequestPickupScreen'));
const ProfileScreen = lazyLoad(() => import('../screens/Profile/ProfileScreen'));
const NotificationsScreen = lazyLoad(() => import('../screens/Notifications/NotificationsScreen'));
const NotificationPreferencesScreen = lazyLoad(() => import('../screens/Notifications/NotificationPreferencesScreen'));

export default function AppRoutes() {
  return (
    <Routes>
      {/* مسارات المصادقة العامة */}
      <Route 
        path="/login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <LoginScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <ProtectedRoute requireAuth={false}>
            <RegisterScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* مسارات محمية */}
      <Route 
        path="/points" 
        element={
          <ProtectedRoute>
            <PointsScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/companies" 
        element={
          <ProtectedRoute>
            <CompaniesScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vehicles" 
        element={
          <ProtectedRoute>
            <VehiclesScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute>
            <PaymentsScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pickup" 
        element={
          <ProtectedRoute>
            <RequestPickupScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* Notification routes */}
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <NotificationsScreen />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications/preferences" 
        element={
          <ProtectedRoute>
            <NotificationPreferencesScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* التوجيه الافتراضي وصفحة غير موجود */}
      <Route path="/" element={<Navigate to="/points" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}