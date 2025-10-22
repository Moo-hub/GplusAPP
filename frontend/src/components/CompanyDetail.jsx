import { useParams } from 'react-router-dom';
import useSafeTranslation from '../hooks/useSafeTranslation';

const CompanyDetail = () => {
  const { id } = useParams();
  const { t } = useSafeTranslation();
  
  return (
    <div className="company-detail">
      <h1>{t('companies.details')}</h1>
      <p>{t('companies.idLabel')}: {id}</p>
      <p>{t('common.comingSoon')}</p>
    </div>
  );
};

export default CompanyDetail;