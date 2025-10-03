import { useState, useCallback } from 'react';

/**
 * A custom hook for managing form validation
 * @param {Object} initialValues - The initial form values
 * @param {Function} validateFn - The function to validate the form values
 * @returns {Object} - Form state and handlers
 */
const useFormValidation = (initialValues, validateFn, submitCallback) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // If field was touched, validate on change
    if (touched[name]) {
      const validationErrors = validateFn({
        ...values,
        [name]: fieldValue
      });
      
      setErrors(prev => ({
        ...prev,
        [name]: validationErrors[name]
      }));
    }
  }, [values, touched, validateFn]);

  // Mark field as touched when blur event occurs
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field on blur
    const validationErrors = validateFn(values);
    setErrors(prev => ({
      ...prev,
      [name]: validationErrors[name]
    }));
  }, [values, validateFn]);

  // Validate all fields and prepare for submission
  const handleSubmit = useCallback(async (e, onSubmit) => {
    // handleSubmit may be called as handleSubmit(e) (component passes its onSubmit via
    // the submitCallback argument to the hook) or as handleSubmit(e, onSubmit) when the
    // caller provides an explicit callback. Support both.
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setTouched(allTouched);
    
    // Validate all fields
    const validationErrors = validateFn(values);
    setErrors(validationErrors);
    
    // Check if there are any errors
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    if (!hasErrors) {
      setIsSubmitting(true);
      try {
  // Prefer an explicit onSubmit passed to handleSubmit; otherwise use the submitCallback
  // provided when the hook was created. Fall back to a no-op to avoid throwing if
  // neither exists.
  const submitFn = onSubmit || submitCallback || (async () => {});
  await submitFn(values);
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors(prev => ({
          ...prev,
          form: error.response?.data?.message || error.message || 'An error occurred during form submission'
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateFn]);

  // Reset the form to initial state or new values
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues
  };
};

export default useFormValidation;