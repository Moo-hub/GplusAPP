import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PointsService from '../services/points';

const Profile = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const data = await PointsService.getUserPoints();
      setPointsData(data);
    } catch (err) {
      console.error("Failed to load points data", err);
      setError(t("errors.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("profile.title")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User information */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{t("profile.personalInfo")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("profile.name")}</p>
                <p className="font-medium">{currentUser?.name || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("profile.email")}</p>
                <p className="font-medium">{currentUser?.email || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("profile.phone")}</p>
                <p className="font-medium">{currentUser?.phone || t("profile.notProvided")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("profile.address")}</p>
                <p className="font-medium">{currentUser?.address || t("profile.notProvided")}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/profile/edit" className="text-primary-dark hover:underline">
                {t("profile.editProfile")}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Points summary */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t("profile.points")}</h2>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {loading && <p className="text-gray-500 mb-4">{t("loading")}...</p>}
            
            {!loading && pointsData && (
              <div className="space-y-4">
                <div className="bg-primary-light text-white p-4 rounded-lg flex justify-between items-center">
                  <span className="font-medium">{t("profile.balance")}</span>
                  <span className="text-2xl font-bold">{pointsData.balance}</span>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="mb-2">
                    <span className="font-medium">{t("profile.impact")}: </span>
                    {pointsData.impact}
                  </p>
                  <p>
                    <span className="font-medium">{t("profile.monthlyPoints")}: </span>
                    {pointsData.monthlyPoints}
                  </p>
                </div>
                
                <div className="pt-4 flex flex-col space-y-2">
                  <Link
                    to="/rewards"
                    className="bg-primary-dark hover:bg-primary text-white py-2 px-4 rounded-md text-center transition-colors"
                  >
                    {t("profile.exploreRewards")}
                  </Link>
                  <Link
                    to="/account/redemptions"
                    className="border border-primary-dark text-primary-dark hover:bg-primary-light hover:text-white py-2 px-4 rounded-md text-center transition-colors"
                  >
                    {t("profile.myRedemptions")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;