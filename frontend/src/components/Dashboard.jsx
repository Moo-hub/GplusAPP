import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  return (
    <div className="dashboard-container" data-testid="dashboard-container">
      <h1 data-testid="dashboard-welcome">{t('dashboard.welcome')}, {currentUser?.name || 'User'}!</h1>
      
      <div className="dashboard-summary" data-testid="dashboard-summary">
        <div className="dashboard-card" data-testid="points-card">
          <h3>{t('dashboard.pointsBalance')}</h3>
          <p className="points-value" data-testid="points-value">{currentUser?.points || 0}</p>
          <a href="/points" className="dashboard-link" data-testid="view-points-link">{t('dashboard.viewPoints')}</a>
        </div>
        
        <div className="dashboard-card" data-testid="pickups-card">
          <h3>{t('dashboard.pickupRequests')}</h3>
          <p>{t('dashboard.schedulePickup')}</p>
          <a href="/pickups/new" className="dashboard-link" data-testid="schedule-pickup-link">{t('dashboard.scheduleNow')}</a>
        </div>
        
        <div className="dashboard-card" data-testid="impact-card">
          <h3>{t('dashboard.environmentalImpact')}</h3>
          <p>{t('dashboard.checkImpact')}</p>
          <a href="/impact" className="dashboard-link" data-testid="view-impact-link">{t('dashboard.viewImpact')}</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;