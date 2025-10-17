import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import PointsService from '../services/points';
import RedemptionsService from '../services/redemptions';

const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [pointsData, setPointsData] = useState(null);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel for better performance
      const [pointsData, redemptionsData] = await Promise.all([
        PointsService.getUserPoints(),
        RedemptionsService.getUserRedemptions()
      ]);
      
      setPointsData(pointsData);
      // Get only the 3 most recent redemptions
      setRecentRedemptions(redemptionsData.slice(0, 3));
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(t("errors.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Helper for formatting dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.welcome')}, {currentUser?.name || 'User'}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Points Summary Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-dark p-4 text-white">
            <h2 className="text-lg font-semibold">{t("dashboard.pointsBalance")}</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <p className="text-center text-gray-500">{t("loading")}...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">{t("dashboard.currentBalance")}</span>
                  <span className="text-2xl font-bold text-primary-dark">{pointsData?.balance || 0}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t("dashboard.monthlyEarned")}</span>
                    <span className="font-medium">{pointsData?.monthlyPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t("dashboard.impact")}</span>
                    <span className="font-medium">{pointsData?.impact || '-'}</span>
                  </div>
                  {pointsData?.reward && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t("dashboard.reward")}</span>
                      <span className="font-medium">{pointsData.reward}</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  to="/rewards" 
                  className="block w-full bg-primary-dark text-white text-center py-2 rounded-md hover:bg-primary transition-colors"
                >
                  {t("dashboard.exploreRewards")}
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Pickup Requests Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-dark p-4 text-white">
            <h2 className="text-lg font-semibold">{t("dashboard.pickupRequests")}</h2>
          </div>
          <div className="p-4">
            <p className="mb-4">{t('dashboard.schedulePickup')}</p>
            <Link 
              to="/pickups/new" 
              className="block w-full bg-primary-dark text-white text-center py-2 rounded-md hover:bg-primary transition-colors"
            >
              {t('dashboard.scheduleNow')}
            </Link>
          </div>
        </div>
        
        {/* Recent Redemptions Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-dark p-4 text-white">
            <h2 className="text-lg font-semibold">{t("dashboard.recentRedemptions")}</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <p className="text-center text-gray-500">{t("loading")}...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : recentRedemptions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentRedemptions.map(redemption => (
                  <div key={redemption.id} className="py-3">
                    <Link to={`/redemptions/${redemption.id}`} className="hover:text-primary-dark">
                      <div className="flex justify-between">
                        <span className="font-medium">{redemption.option.name}</span>
                        <span className="text-sm text-gray-500">{formatDate(redemption.created_at)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${
                          redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          redemption.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`redemptions.${redemption.status}`)}
                        </span>
                        <span className="text-primary-dark font-medium">{redemption.points_spent} {t("rewards.points")}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t("dashboard.noRedemptions")}</p>
            )}
            
            <Link 
              to="/account/redemptions" 
              className="block mt-4 text-center text-primary-dark hover:underline"
            >
              {t("dashboard.viewAllRedemptions")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;