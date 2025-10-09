import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
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