import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RedemptionOptionsService from '../services/redemptionOptions';
import RedemptionsService from '../services/redemptions';
import PointsService from '../services/points';

export default function RedemptionDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [option, setOption] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch in parallel for better performance
      const [optionData, pointsData] = await Promise.all([
        RedemptionOptionsService.getOption(id),
        PointsService.getUserPoints()
      ]);
      
      setOption(optionData);
      setUserPoints(pointsData);
    } catch (err) {
      console.error("Failed to load data", err);
      setError(t("failed_to_load_data"));
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      setRedeeming(true);
      setError(null);
      
      // Check if user has enough points
      if (userPoints.balance < option.points_required) {
        setError(t("insufficient_points"));
        return;
      }
      
      // Redeem points
      const redemptionResult = await RedemptionsService.redeemPoints(option.id);
      
      // Show success message
      setSuccessMessage(t("redemption_successful"));
      
      // Refresh user points
      const updatedPoints = await PointsService.getUserPoints();
      setUserPoints(updatedPoints);
      
      // Refresh option data (to get updated stock)
      const updatedOption = await RedemptionOptionsService.getOption(id);
      setOption(updatedOption);
      
      // Navigate to redemption details page after a short delay
      setTimeout(() => {
        navigate(`/redemptions/${redemptionResult.id}`);
      }, 2000);
    } catch (err) {
      console.error("Failed to redeem points", err);
      setError(err.response?.data?.detail || t("redemption_failed"));
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="container mx-auto p-4">{t("loading")}...</div>;
  if (!option) return <div className="container mx-auto p-4 text-red-500">{t("option_not_found")}</div>;

  const canRedeem = option.is_active && (option.stock > 0 || option.stock === -1) && userPoints?.balance >= option.points_required;

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => navigate('/rewards')}
        className="mb-4 flex items-center text-primary-dark hover:underline"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        {t("back_to_rewards")}
      </button>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {option.image_url && (
            <div className="md:w-1/2 h-64 md:h-auto">
              <img 
                src={option.image_url} 
                alt={option.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 md:w-1/2">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold mb-2">{option.name}</h1>
              <span className="bg-primary-light text-white px-3 py-1 rounded-md font-bold">
                {option.points_required} {t('points')}
              </span>
            </div>
            
            {option.partner && (
              <div className="text-sm text-gray-600 mb-4">
                {t('by')} {option.partner.name}
              </div>
            )}
            
            <p className="text-gray-700 mb-6">{option.description}</p>
            
            {option.stock !== -1 && (
              <div className={`text-sm mb-4 ${option.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {option.stock > 0 
                  ? `${t('in_stock')}: ${option.stock} ${t('remaining')}` 
                  : t('out_of_stock')}
              </div>
            )}
            
            {/* User's points */}
            <div className="bg-gray-100 p-4 rounded-md mb-6">
              <div className="flex justify-between">
                <span>{t('your_points')}</span>
                <span className="font-bold">{userPoints?.balance || 0}</span>
              </div>
              
              {!canRedeem && userPoints?.balance < option.points_required && (
                <div className="text-sm text-red-500 mt-2">
                  {t('need_more_points', { count: option.points_required - userPoints.balance })}
                </div>
              )}
            </div>
            
            {/* Error and success messages */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            
            <button
              onClick={handleRedeem}
              disabled={!canRedeem || redeeming}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                canRedeem && !redeeming
                  ? 'bg-primary-dark hover:bg-primary' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {redeeming ? t('processing') : t('redeem_reward')}
            </button>
            
            {!option.is_active && (
              <div className="text-sm text-red-500 text-center mt-2">
                {t('option_not_available')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}