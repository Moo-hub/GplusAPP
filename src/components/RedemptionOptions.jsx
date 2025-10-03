import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import RedemptionOptionsService from '../services/redemptionOptions';
import { Link } from 'react-router-dom';

const RedemptionOptionCard = ({ option }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {option.image_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={option.image_url} 
            alt={option.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{option.name}</h3>
          <span className="bg-primary-light text-white px-2 py-1 rounded-md text-sm font-bold">
            {option.points_required} {t('points')}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 flex-1">{option.description}</p>
        
        {option.stock !== -1 && (
          <div className="text-sm text-gray-500 mb-2">
            {option.stock > 0 ? `${t('in_stock')}: ${option.stock}` : t('out_of_stock')}
          </div>
        )}
        
        <Link 
          to={`/rewards/${option.id}`} 
          className={`text-center py-2 px-4 rounded-md w-full transition-colors duration-300 ${
            option.stock === 0 
              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
              : 'bg-primary-dark hover:bg-primary text-white'
          }`}
          aria-disabled={option.stock === 0}
        >
          {t('view_details')}
        </Link>
      </div>
    </div>
  );
};

export default function RedemptionOptions() {
  const { t } = useTranslation();
  const [options, setOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRedemptionOptions();
  }, []);

  const fetchRedemptionOptions = async () => {
    try {
      setLoading(true);
      const data = await RedemptionOptionsService.getOptions();
      setOptions(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(option => option.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Failed to load redemption options", err);
      setError(t("failed_to_load_options"));
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = selectedCategory === 'all'
    ? options
    : options.filter(option => option.category === selectedCategory);

  if (loading) return <div className="p-4">{t("loading")}...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("rewards_catalog")}</h1>
      
      {/* Categories filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("categories")}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm ${
                selectedCategory === 'all' 
                  ? 'bg-primary-dark text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {t("all")}
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedCategory === category 
                    ? 'bg-primary-dark text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Options grid */}
      {filteredOptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOptions.map(option => (
            <RedemptionOptionCard key={option.id} option={option} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">{t("no_options_available")}</p>
        </div>
      )}
    </div>
  );
}