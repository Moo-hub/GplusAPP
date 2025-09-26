import React, { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import './index.css';

const Pickup = lazy(() => import('./components/Pickup'));
const PickupSchedule = lazy(() => import('./components/PickupSchedule'));
const Vehicles = lazy(() => import('./components/Vehicles'));
const Points = lazy(() => import('./components/Points'));
const Payment = lazy(() => import('./components/Payment'));
const Companies = lazy(() => import('./components/Companies'));
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { i18n } = useTranslation();
  React.useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
          <Header />
          <main className="max-w-2xl mx-auto p-4">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <Routes>
                <Route path="/pickup" element={<Pickup />} />
                <Route path="/schedule" element={<PickupSchedule />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/points" element={<Points />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="*" element={<Navigate to="/pickup" replace />} />
              </Routes>
            </Suspense>
          </main>
          <ToastContainer position="top-center" autoClose={2000} />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;

