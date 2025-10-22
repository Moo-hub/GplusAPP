import { lazy } from 'react';

// Import NotificationsList and NotificationPreferences components
const NotificationsList = lazy(() => import('../components/NotificationsList'));
const NotificationPreferences = lazy(() => import('../components/NotificationPreferences'));

const NotificationRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<NotificationsList />} />
      <Route path="/preferences" element={<NotificationPreferences />} />
    </Routes>
  );
};

export default NotificationRoutes;