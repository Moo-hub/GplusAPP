import { useState } from 'react';
import useSafeTranslation from '../../hooks/useSafeTranslation';
import './AdminScreen.css';

const AdminScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'companies':
        return <CompanyManagement />;
      case 'pickups':
        return <PickupManagement />;
      case 'stats':
        return <SystemStats />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>{t('admin.dashboard')}</h1>
        <p className="admin-subtitle">{t('admin.managementPortal')}</p>
      </div>

      <div className="admin-container">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button 
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="admin-nav-icon">👤</span>
              {t('admin.userManagement')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              <span className="admin-nav-icon">🏢</span>
              {t('admin.companyManagement')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'pickups' ? 'active' : ''}`}
              onClick={() => setActiveTab('pickups')}
            >
              <span className="admin-nav-icon">♻️</span>
              {t('admin.pickupManagement')}
            </button>
            
            <button 
              className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <span className="admin-nav-icon">📊</span>
              {t('admin.systemStats')}
            </button>
          </nav>
        </div>

        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;