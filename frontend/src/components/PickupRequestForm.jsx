import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';

const createPickupRequest = (data) => api.post('/pickup', data);

const PickupRequestForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    materials: [],
    weight_estimate: 1,
    scheduled_date: '',
    address: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const mutation = useMutation({
    mutationFn: createPickupRequest,
    onSuccess: () => {
      toast.success(t('pickup.requestSuccess'));
      navigate('/pickups');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || t('errors.generalError'));
    }
  });
  
  const materialOptions = [
    { id: 'plastic', name: t('materials.plastic') },
    { id: 'paper', name: t('materials.paper') },
    { id: 'glass', name: t('materials.glass') },
    { id: 'metal', name: t('materials.metal') },
    { id: 'electronics', name: t('materials.electronics') }
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData({
        ...formData,
        materials: [...formData.materials, value]
      });
    } else {
      setFormData({
        ...formData,
        materials: formData.materials.filter(material => material !== value)
      });
    }
    
    // Clear materials error if it exists
    if (errors.materials) {
      setErrors({ ...errors, materials: null });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (formData.materials.length === 0) {
      newErrors.materials = t('validation.materialsRequired');
    }
    
    if (!formData.weight_estimate || formData.weight_estimate <= 0) {
      newErrors.weight_estimate = t('validation.weightRequired');
    }
    
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = t('validation.dateRequired');
    } else {
      const selectedDate = new Date(formData.scheduled_date);
      const now = new Date();
      if (selectedDate < now) {
        newErrors.scheduled_date = t('validation.dateInPast');
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('validation.addressRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      mutation.mutate(formData);
    }
  };
  
  // Calculate minimum date for the date picker (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  return (
    <div className="pickup-form-container">
      <h1>{t('pickup.newRequest')}</h1>
      
      <form onSubmit={handleSubmit} className="pickup-form">
        <div className="form-group">
          <label>{t('pickup.selectMaterials')}</label>
          <div className="checkbox-group">
            {materialOptions.map(material => (
              <label key={material.id} className="checkbox-label">
                <input
                  type="checkbox"
                  value={material.id}
                  onChange={handleCheckboxChange}
                  checked={formData.materials.includes(material.id)}
                />
                {material.name}
              </label>
            ))}
          </div>
          {errors.materials && <div className="error-message">{errors.materials}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="weight_estimate">{t('pickup.weightEstimate')} (kg)</label>
          <input
            type="number"
            id="weight_estimate"
            name="weight_estimate"
            value={formData.weight_estimate}
            onChange={handleInputChange}
            min="0.1"
            step="0.1"
            required
          />
          {errors.weight_estimate && <div className="error-message">{errors.weight_estimate}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="scheduled_date">{t('pickup.pickupDate')}</label>
          <input
            type="datetime-local"
            id="scheduled_date"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleInputChange}
            min={getMinDate()}
            required
          />
          {errors.scheduled_date && <div className="error-message">{errors.scheduled_date}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="address">{t('pickup.address')}</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          {errors.address && <div className="error-message">{errors.address}</div>}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/pickups')}
          >
            {t('common.cancel')}
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? t('common.submitting') : t('pickup.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PickupRequestForm;