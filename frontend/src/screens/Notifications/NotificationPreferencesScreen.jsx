import useSafeTranslation from '../../hooks/useSafeTranslation';
import './NotificationPreferencesScreen.css';

const NotificationPreferencesScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="notification-preferences-screen">
      <div className="notification-preferences-header">
        <h1>{t('notifications.preferences.title')}</h1>
        <p>{t('notifications.preferences.screenDescription')}</p>
        <div className="back-link-container">
          <Link to="/notifications" className="back-link">
            &larr; {t('notifications.backToNotifications')}
          </Link>
        </div>
      </div>
      
      <NotificationPreferences />
    </div>
  );
};

export default NotificationPreferencesScreen;