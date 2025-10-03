import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './PickupForm.css';

const createPickupRequest = (data) => api.post('/pickup', data);
const fetchAvailableTimeSlots = async (date) => {
  if (!date) return { slots: [] };
  const formattedDate = date.toISOString().split('T')[0];
  const response = await api.get(`/pickup/available-slots/${formattedDate}`);
  return response.data;
};
const fetchRecurringDates = async (startDate, recurrenceType) => {
  if (!startDate || !recurrenceType || recurrenceType === 'none') return [];
  const formattedDate = startDate.toISOString().split('T')[0];
  const response = await api.get(`/pickup/recurring-dates?start_date=${formattedDate}&recurrence_type=${recurrenceType}`);
  return response.data;
};

const PickupRequestForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    materials: [],
    weight_estimate: 1,
    scheduled_date: '',
    address: '',
    time_slot: '',
    is_recurring: false,
    recurrence_type: 'none',
    recurrence_end_date: '',
    calendar_event_id: null
  });
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Refs for focus management
  const formStartRef = useRef(null);
  const errorRefs = useRef({});
  
  // Set focus to first error when errors appear
  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const errorElement = errorRefs.current[firstErrorKey];
      errorElement?.focus();
    }
  }, [errors]);
  
  // Query for available time slots based on selected date
  const {
    data: availableSlots,
    isLoading: loadingSlots,
    refetch: refetchSlots
  } = useQuery({
    queryKey: ['availableTimeSlots', selectedDate],
    queryFn: () => fetchAvailableTimeSlots(selectedDate),
    enabled: !!selectedDate
  });
  
  // Query for recurring dates when recurrence type is selected
  const {
    data: recurringDates,
    isLoading: loadingRecurringDates
  } = useQuery({
    queryKey: ['recurringDates', selectedDate, formData.recurrence_type],
    queryFn: () => fetchRecurringDates(selectedDate, formData.recurrence_type),
    enabled: !!selectedDate && formData.is_recurring && formData.recurrence_type !== 'none'
  });
  
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduled_date: selectedDate.toISOString()
      }));
      refetchSlots();
    }
  }, [selectedDate, refetchSlots]);
  
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
  
  const timeSlotOptions = [
    { id: '09:00-12:00', name: t('pickup.timeSlots.morning') },
    { id: '13:00-16:00', name: t('pickup.timeSlots.afternoon') },
    { id: '17:00-20:00', name: t('pickup.timeSlots.evening') }
  ];
  
  const recurrenceOptions = [
    { id: 'none', name: t('pickup.recurrence.none') },
    { id: 'weekly', name: t('pickup.recurrence.weekly') },
    { id: 'bi_weekly', name: t('pickup.recurrence.biWeekly') },
    { id: 'monthly', name: t('pickup.recurrence.monthly') }
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
    
    // Special handling for recurrence type
    if (name === 'recurrence_type') {
      if (value === 'none') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          is_recurring: false,
          recurrence_end_date: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          is_recurring: true
        }));
      }
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'is_recurring') {
      setFormData({
        ...formData,
        is_recurring: checked,
        recurrence_type: checked ? 'weekly' : 'none'
      });
      return;
    }
    
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
  
  const handleCalendarChange = (date) => {
    setSelectedDate(date);
  };
  
  const handleTimeSlotSelect = (slot) => {
    setFormData({
      ...formData,
      time_slot: slot
    });
    if (errors.time_slot) {
      setErrors({ ...errors, time_slot: null });
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
    
    if (!formData.time_slot) {
      newErrors.time_slot = t('validation.timeSlotRequired');
    }
    
    if (formData.is_recurring && !formData.recurrence_end_date) {
      newErrors.recurrence_end_date = t('validation.recurrenceEndDateRequired');
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
      
      <form onSubmit={handleSubmit} className="pickup-form" ref={formStartRef}>
        <div className="form-group">
          <label>{t('pickup.selectMaterials')}</label>
          <div className="checkbox-group">
            {materialOptions.map(material => (
              <div key={material.id} className="checkbox-label">
                <input
                  id={`material-${material.id}`}
                  name="materials"
                  type="checkbox"
                  value={material.id}
                  onChange={handleCheckboxChange}
                  checked={formData.materials.includes(material.id)}
                />
                <label htmlFor={`material-${material.id}`}>{material.name}</label>
              </div>
            ))}
          </div>
          {errors.materials && (
            <div 
              id="materials-error" 
              className="error-message" 
              role="alert"
              ref={el => errorRefs.current.materials = el}
              tabIndex="-1"
            >
              {errors.materials}
            </div>
          )}
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
            aria-describedby={errors.weight_estimate ? "weight-error" : undefined}
            aria-invalid={errors.weight_estimate ? "true" : "false"}
            required
          />
          {errors.weight_estimate && (
            <div 
              id="weight-error" 
              className="error-message" 
              role="alert"
              ref={el => errorRefs.current.weight_estimate = el}
              tabIndex="-1"
            >
              {errors.weight_estimate}
            </div>
          )}
        </div>
        
        {/* Calendar for date selection */}
        <div className="form-group calendar-section">
          <label id="calendar-label">{t('pickup.pickupDate')}</label>
          <Calendar
            onChange={handleCalendarChange}
            value={selectedDate}
            minDate={new Date()}
            maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 days from now
            className="pickup-calendar"
            navigationLabel={({ date }) => `${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
            nextLabel={t('calendar.next')}
            prevLabel={t('calendar.prev')}
            next2Label={t('calendar.nextYear')}
            prev2Label={t('calendar.prevYear')}
            showNeighboringMonth={false}
            aria-labelledby="calendar-label"
            tileClassName={({ date, view }) => {
              if (view === 'month') {
                const today = new Date();
                return date.toDateString() === today.toDateString() ? 'today' : null;
              }
            }}
          />
          {errors.scheduled_date && (
            <div 
              id="scheduled-date-error" 
              className="error-message" 
              role="alert"
              ref={el => errorRefs.current.scheduled_date = el}
              tabIndex="-1"
            >
              {errors.scheduled_date}
            </div>
          )}
        </div>
        
        {/* Time slot selection */}
        {selectedDate && (
          <div className="form-group">
            <label id="time-slot-group-label">{t('pickup.selectTimeSlot')}</label>
            <div 
              className="time-slot-container" 
              role="radiogroup"
              aria-labelledby="time-slot-group-label"
              aria-describedby={errors.time_slot ? "time-slot-error" : undefined}
            >
              {loadingSlots ? (
                <div className="loading-slots">{t('common.loading')}</div>
              ) : (
                timeSlotOptions.map(slot => {
                  const slotInfo = availableSlots?.slots?.find(s => s.slot === slot.id) || { available: true };
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={`time-slot-btn ${formData.time_slot === slot.id ? 'selected' : ''} ${!slotInfo.available ? 'unavailable' : ''}`}
                      onClick={() => handleTimeSlotSelect(slot.id)}
                      disabled={!slotInfo.available}
                      role="radio"
                      aria-checked={formData.time_slot === slot.id}
                      aria-label={`${slot.name}${!slotInfo.available ? ' - ' + t('pickup.booked') : ''}`}
                    >
                      {slot.name}
                      {!slotInfo.available && <span className="slot-booked"> ({t('pickup.booked')})</span>}
                    </button>
                  );
                })
              )}
            </div>
            {errors.time_slot && (
              <div 
                id="time-slot-error" 
                className="error-message" 
                role="alert"
                ref={el => errorRefs.current.time_slot = el}
                tabIndex="-1"
              >
                {errors.time_slot}
              </div>
            )}
          </div>
        )}
        
        {/* Recurring pickup options */}
        <div className="form-group">
          <div className="checkbox-single">
            <input
              type="checkbox"
              id="is_recurring"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="is_recurring">{t('pickup.setupRecurringPickup')}</label>
          </div>
          
          {formData.is_recurring && (
            <div className="recurring-options">
              <div className="select-group">
                <label htmlFor="recurrence_type">{t('pickup.recurrenceFrequency')}</label>
                <select
                  id="recurrence_type"
                  name="recurrence_type"
                  value={formData.recurrence_type}
                  onChange={handleInputChange}
                >
                  {recurrenceOptions.map(option => (
                    option.id !== 'none' && (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    )
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="recurrence_end_date">{t('pickup.recurringEndDate')}</label>
                <input
                  type="date"
                  id="recurrence_end_date"
                  name="recurrence_end_date"
                  value={formData.recurrence_end_date}
                  onChange={handleInputChange}
                  min={selectedDate ? new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : getMinDate()}
                  required={formData.is_recurring}
                  aria-describedby={errors.recurrence_end_date ? "recurrence-end-error" : undefined}
                  aria-invalid={errors.recurrence_end_date ? "true" : "false"}
                />
                {errors.recurrence_end_date && (
                  <div 
                    id="recurrence-end-error" 
                    className="error-message" 
                    role="alert"
                    ref={el => errorRefs.current.recurrence_end_date = el}
                    tabIndex="-1"
                  >
                    {errors.recurrence_end_date}
                  </div>
                )}
              </div>
              
              {/* Display recurring dates preview */}
              {!loadingRecurringDates && recurringDates && recurringDates.length > 0 && (
                <div className="recurring-dates-preview">
                  <h4>{t('pickup.recurringDatesPreview')}</h4>
                  <ul className="dates-list">
                    {recurringDates.slice(0, 5).map((date, index) => (
                      <li key={index}>{new Date(date).toLocaleDateString()}</li>
                    ))}
                    {recurringDates.length > 5 && (
                      <li>+ {recurringDates.length - 5} {t('common.more')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="address">{t('pickup.address')}</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            aria-describedby={errors.address ? "address-error" : undefined}
            aria-invalid={errors.address ? "true" : "false"}
            required
          />
          {errors.address && (
            <div 
              id="address-error" 
              className="error-message" 
              role="alert"
              ref={el => errorRefs.current.address = el}
              tabIndex="-1"
            >
              {errors.address}
            </div>
          )}
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