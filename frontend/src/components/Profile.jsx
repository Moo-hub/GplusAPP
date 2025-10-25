import { useAuth } from '../contexts/AuthContext.jsx';
import useSafeTranslation from '../hooks/useSafeTranslation';

const Profile = () => {
  const { currentUser } = useAuth();
  const { t } = useSafeTranslation();
  
  return (
    <div className="profile">
      <h1>{t('profile.title')}</h1>
      <div className="profile-info">
        <p><strong>{t('profile.name')}:</strong> {currentUser?.name}</p>
        <p><strong>{t('profile.email')}:</strong> {currentUser?.email}</p>
      </div>
    </div>
  );
};

export default Profile;