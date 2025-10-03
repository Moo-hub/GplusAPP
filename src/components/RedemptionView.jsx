import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RedemptionsService from '../services/redemptions';

// Helper for formatting dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper for status badges
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    expired: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span className={`px-2 py-1 rounded-md border ${statusStyles[status] || 'bg-gray-100'}`}>
      {t(status)}
    </span>
  );
};

export default function RedemptionView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [redemption, setRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchRedemption();
  }, [id]);

  const fetchRedemption = async () => {
    try {
      setLoading(true);
      const data = await RedemptionsService.getRedemption(id);
      setRedemption(data);
    } catch (err) {
      console.error("Failed to load redemption", err);
      setError(t("failed_to_load_redemption"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await RedemptionsService.cancelRedemption(id);
      setSuccessMessage(t("redemption_cancelled"));
      
      // Refresh data
      fetchRedemption();
    } catch (err) {
      console.error("Failed to cancel redemption", err);
      setError(err.response?.data?.detail || t("cancellation_failed"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container mx-auto p-4">{t("loading")}...</div>;
  if (!redemption) return <div className="container mx-auto p-4 text-red-500">{t("redemption_not_found")}</div>;

  const canCancel = redemption.status === "pending";

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => navigate('/account/redemptions')}
        className="mb-4 flex items-center text-primary-dark hover:underline"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        {t("back_to_redemptions")}
      </button>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">{redemption.option.name}</h1>
              <p className="text-gray-600">{t("redemption_id")}: #{redemption.id}</p>
            </div>
            
            <StatusBadge status={redemption.status} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("redemption_details")}</h2>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-gray-600">{t("date")}:</p>
                  <p>{formatDate(redemption.created_at)}</p>
                  
                  <p className="text-gray-600">{t("points_spent")}:</p>
                  <p className="font-semibold">{redemption.points_spent}</p>
                  
                  {redemption.redemption_code && (
                    <>
                      <p className="text-gray-600">{t("redemption_code")}:</p>
                      <p className="font-mono bg-gray-100 p-1 rounded">{redemption.redemption_code}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("reward_details")}</h2>
              
              <div className="bg-gray-50 p-4 rounded-md">
                {redemption.option.image_url && (
                  <img 
                    src={redemption.option.image_url} 
                    alt={redemption.option.name} 
                    className="w-16 h-16 object-cover rounded-md mb-2"
                  />
                )}
                
                <p className="text-gray-600 mb-1">{t("description")}:</p>
                <p>{redemption.option.description}</p>
              </div>
            </div>
          </div>
          
          {redemption.notes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{t("notes")}</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>{redemption.notes}</p>
              </div>
            </div>
          )}
          
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
          
          {canCancel && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                {cancelling ? t("processing") : t("cancel_redemption")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}