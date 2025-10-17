import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { updateProfile } from '../../services/profileService';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { currentUser, setCurrentUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updatedUser = await updateProfile(formData);
      setCurrentUser({
        ...currentUser,
        ...updatedUser
      });
      setIsEditing(false);
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      toast.error(t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="profile-container">
      <h2 className="profile-title">{t('profile.title')}</h2>
      <Card variant="light">
        {!isEditing ? (
          // عرض المعلومات
          (<div className="profile-view">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-detail-item">
                <label>{t('profile.name')}:</label>
                <p>{currentUser?.name}</p>
              </div>
              
              <div className="profile-detail-item">
                <label>{t('profile.email')}:</label>
                <p>{currentUser?.email}</p>
              </div>
              
              {currentUser?.phone && (
                <div className="profile-detail-item">
                  <label>{t('profile.phone')}:</label>
                  <p>{currentUser.phone}</p>
                </div>
              )}
              
              {currentUser?.address && (
                <div className="profile-detail-item">
                  <label>{t('profile.address')}:</label>
                  <p>{currentUser.address}</p>
                </div>
              )}
              
              <div className="profile-actions">
                <Button 
                  variant="primary" 
                  onClick={() => setIsEditing(true)}
                >
                  {t('profile.edit')}
                </Button>
              </div>
            </div>
          </div>)
        ) : (
          // نموذج التحرير
          (<form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('profile.name')}</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('profile.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">{t('profile.phone')}</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">{t('profile.address')}</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>)
        )}
      </Card>
    </div>
  );
}