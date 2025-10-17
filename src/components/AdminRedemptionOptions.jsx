import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import RedemptionOptionsService from '../services/redemptionOptions';
import PartnersService from '../services/partners';
import { Link } from 'react-router-dom';

export default function AdminRedemptionOptions() {
  const { t } = useTranslation();
  const [options, setOptions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch partners and options in parallel
      const [optionsData, partnersData] = await Promise.all([
        RedemptionOptionsService.getOptions({ is_active: showInactive ? undefined : true }),
        PartnersService.getPartners(false) // include inactive partners too
      ]);
      
      setOptions(optionsData);
      setPartners(partnersData);
    } catch (err) {
      console.error("Failed to load data", err);
      setError(t("failed_to_load_data"));
    } finally {
      setLoading(false);
    }
  };
  
  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : t('no_partner');
  };

  if (loading) return <div className="p-4">{t("loading")}...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("manage_redemption_options")}</h1>
        <Link 
          to="/admin/redemption-options/new" 
          className="bg-primary-dark hover:bg-primary text-white py-2 px-4 rounded-md transition-colors"
        >
          {t("add_new_option")}
        </Link>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={() => setShowInactive(!showInactive)}
            className="mr-2"
          />
          <label htmlFor="showInactive">{t("show_inactive_options")}</label>
        </div>
        
        <button
          onClick={fetchData}
          className="text-primary-dark hover:underline"
        >
          {t("refresh")}
        </button>
      </div>
      
      {options.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("name")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("points")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("partner")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("category")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("stock")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("status")}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {options.map((option) => (
                <tr key={option.id} className={!option.is_active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {option.image_url ? (
                        <img 
                          className="h-10 w-10 rounded-full mr-3 object-cover" 
                          src={option.image_url} 
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No img</span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {option.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{option.points_required}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getPartnerName(option.partner_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{option.category || t('uncategorized')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {option.stock === -1 ? t('unlimited') : option.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      option.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {option.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/admin/redemption-options/${option.id}`}
                      className="text-primary-dark hover:text-primary mr-3"
                    >
                      {t('edit')}
                    </Link>
                    <Link 
                      to={`/rewards/${option.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {t('view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">{t("no_options_available")}</p>
          <Link
            to="/admin/redemption-options/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-dark hover:bg-primary"
          >
            {t("create_first_option")}
          </Link>
        </div>
      )}
    </div>
  );
}