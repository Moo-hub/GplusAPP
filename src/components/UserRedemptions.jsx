import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RedemptionsService from '../services/redemptions';

// Helper for formatting dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Status badge component
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusStyles[status] || 'bg-gray-100'}`}>
      {t(status)}
    </span>
  );
};

export default function UserRedemptions() {
  const { t } = useTranslation();
  const [redemptions, setRedemptions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const data = await RedemptionsService.getUserRedemptions();
      setRedemptions(data);
    } catch (err) {
      console.error("Failed to load redemptions", err);
      setError(t("failed_to_load_redemptions"));
    } finally {
      setLoading(false);
    }
  };

  const filteredRedemptions = activeFilter === 'all' 
    ? redemptions 
    : redemptions.filter(redemption => redemption.status === activeFilter);

  if (loading) return <div className="p-4">{t("loading")}...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("my_redemptions")}</h1>
        <Link 
          to="/rewards" 
          className="bg-primary-dark hover:bg-primary text-white py-2 px-4 rounded-md transition-colors"
        >
          {t("browse_rewards")}
        </Link>
      </div>
      
      {/* Filter tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {['all', 'pending', 'completed', 'cancelled'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-4 px-1 font-medium text-sm border-b-2 ${
                  activeFilter === filter
                    ? 'border-primary-dark text-primary-dark'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t(filter)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Redemptions list */}
      {filteredRedemptions.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredRedemptions.map(redemption => (
              <li key={redemption.id}>
                <Link 
                  to={`/redemptions/${redemption.id}`} 
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-4 flex items-center">
                    {redemption.option.image_url ? (
                      <img 
                        src={redemption.option.image_url} 
                        alt={redemption.option.name} 
                        className="w-12 h-12 object-cover rounded-md mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {redemption.option.name}
                        </p>
                        <StatusBadge status={redemption.status} />
                      </div>
                      <div className="mt-1 flex justify-between">
                        <p className="text-sm text-gray-500">
                          {formatDate(redemption.created_at)}
                        </p>
                        <p className="text-sm font-medium text-primary-dark">
                          {redemption.points_spent} {t('points')}
                        </p>
                      </div>
                    </div>
                    
                    <svg className="h-5 w-5 text-gray-400 ml-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t("no_redemptions")}</h3>
          <p className="mt-1 text-sm text-gray-500">{t("no_redemptions_desc")}</p>
          <div className="mt-6">
            <Link
              to="/rewards"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-dark hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            >
              {t("browse_rewards")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}