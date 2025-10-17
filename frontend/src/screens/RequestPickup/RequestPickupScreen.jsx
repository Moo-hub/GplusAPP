import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TimeSlotSelector from "../../components/TimeSlotSelector/TimeSlotSelector";
import RecurrenceSelector from "../../components/RecurrenceSelector/RecurrenceSelector";
import MaterialsSelector from "../../components/MaterialsSelector/MaterialsSelector";
import pickupService from "../../services/pickup.service";
import { useTranslation } from "react-i18next";
import "./RequestPickupScreen.css";

export default function RequestPickupScreen() {
  const { t } = useTranslation();
  
  // Form state
  const [materials, setMaterials] = useState([]);
  const [address, setAddress] = useState("");
  const [weightEstimate, setWeightEstimate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Get available time slots on component mount
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoadingSlots(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await pickupService.getAvailableTimeSlots(today);
        setAvailableSlots(response.data);
        
        // Set default selected date to today
        if (response.data.length > 0) {
          setSelectedDate(response.data[0].date);
        }
      } catch (err) {
        setError("Failed to load available time slots: " + (err.message || "Unknown error"));
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, []);

  // Set default end date for recurring pickups (3 months from today)
  useEffect(() => {
    if (isRecurring) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      setRecurrenceEndDate(endDate.toISOString().split('T')[0]);
    }
  }, [isRecurring]);

  const handleRequest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const pickupData = {
        materials,
        address,
        weight_estimate: parseFloat(weightEstimate) || 0,
        scheduled_date: `${selectedDate}T${selectedTimeSlot.split('-')[0]}:00Z`,
        time_slot: selectedTimeSlot,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : "none",
        recurrence_end_date: isRecurring ? `${recurrenceEndDate}T23:59:59Z` : null
      };

      const response = await pickupService.createPickupRequest(pickupData);
      setResult({
        requestId: response.data.id,
        scheduledDate: new Date(response.data.scheduled_date).toLocaleString()
      });
    } catch (err) {
      setError(err.message || "Failed to request pickup");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (materials.length === 0) {
      setError("Please select at least one material");
      return false;
    }
    
    if (!address) {
      setError("Please enter your address");
      return false;
    }
    
    if (!selectedDate || !selectedTimeSlot) {
      setError("Please select a date and time slot");
      return false;
    }
    
    if (isRecurring && !recurrenceEndDate) {
      setError("Please select an end date for recurring pickups");
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && materials.length === 0) {
      setError("Please select at least one material");
      return;
    }
    
    if (currentStep === 2 && !address) {
      setError("Please enter your address");
      return;
    }

    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3 className="step-title">{t('pickup.step1')}</h3>
            <MaterialsSelector
              selectedMaterials={materials}
              onMaterialsChange={setMaterials}
            />
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3 className="step-title">{t('pickup.step2')}</h3>
            <div className="form-group">
              <label htmlFor="address">{t('pickup.address')}</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('pickup.addressPlaceholder')}
                className="input-field"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="weight">{t('pickup.weight')}</label>
              <input
                type="number"
                id="weight"
                value={weightEstimate}
                onChange={(e) => setWeightEstimate(e.target.value)}
                placeholder={t('pickup.weightPlaceholder')}
                className="input-field"
                min="0"
                step="0.1"
              />
              <small>{t('pickup.weightHelp')}</small>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">{t('pickup.step3')}</h3>
            {loadingSlots ? (
              <div className="loading-slots">{t('pickup.loadingSlots')}</div>
            ) : (
              <TimeSlotSelector
                availableSlots={availableSlots}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onDateChange={setSelectedDate}
                onTimeSlotChange={setSelectedTimeSlot}
              />
            )}
            
            <RecurrenceSelector
              isRecurring={isRecurring}
              recurrenceType={recurrenceType}
              recurrenceEndDate={recurrenceEndDate}
              onRecurringChange={setIsRecurring}
              onRecurrenceTypeChange={setRecurrenceType}
              onEndDateChange={setRecurrenceEndDate}
            />
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h3 className="step-title">{t('pickup.review')}</h3>
            <div className="review-summary">
              <div className="review-item">
                <h4>{t('pickup.materials')}</h4>
                <p>{materials.join(", ")}</p>
              </div>
              
              <div className="review-item">
                <h4>{t('pickup.address')}</h4>
                <p>{address}</p>
              </div>
              
              <div className="review-item">
                <h4>{t('pickup.weight')}</h4>
                <p>{weightEstimate ? `${weightEstimate} kg` : t('pickup.notSpecified')}</p>
              </div>
              
              <div className="review-item">
                <h4>{t('pickup.schedule')}</h4>
                <p>
                  {selectedDate && new Date(selectedDate).toLocaleDateString()} <br />
                  {selectedTimeSlot}
                </p>
              </div>
              
              {isRecurring && (
                <div className="review-item">
                  <h4>{t('pickup.recurrence')}</h4>
                  <p>
                    {recurrenceType === "weekly" && t('pickup.weekly')}
                    {recurrenceType === "bi_weekly" && t('pickup.biWeekly')}
                    {recurrenceType === "monthly" && t('pickup.monthly')} <br />
                    {t('pickup.until')} {new Date(recurrenceEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="request-pickup-container">
      <Card title={t('pickup.title')} variant="dark">
        {result ? (
          <div className="request-success">
            <h3>{t('pickup.success')}</h3>
            <p>{t('pickup.requestId')}: {result.requestId}</p>
            <p>{t('pickup.scheduledDate')}: {result.scheduledDate}</p>
            {isRecurring && <p>{t('pickup.recurringNote')}</p>}
            <Button 
              variant="secondary" 
              onClick={() => {
                setResult(null);
                setCurrentStep(1);
              }}
              size="medium"
            >
              {t('pickup.requestAnother')}
            </Button>
          </div>
        ) : (
          <>
            <div className="step-indicator">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step} 
                  className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                  {step}
                </div>
              ))}
            </div>
            
            {error && <p className="request-error">{error}</p>}
            
            {renderStepContent()}
            
            <div className="step-navigation">
              {currentStep > 1 && (
                <Button 
                  variant="secondary" 
                  onClick={prevStep}
                  size="medium"
                >
                  {t('pickup.back')}
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button 
                  variant="primary" 
                  onClick={nextStep}
                  size="medium"
                >
                  {t('pickup.next')}
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleRequest}
                  size="medium"
                  disabled={loading}
                >
                  {loading ? t('pickup.requesting') : t('pickup.submit')}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}