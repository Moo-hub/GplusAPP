import { useState, useCallback } from 'react';

/**
 * Utility: derive field value based on input type
 */
const getFieldValue = (e) => {
  const { type, checked, value } = e.target;
  return type === 'checkbox' ? checked : value;
};

/**
 * Default options to initialize the hook
 */
const defaultOptions = {
  validateOnBlur: true,
  validateOnChangeTouched: true,
  initialTouched: {},
  initialErrors: {},
};

/**
 * A custom hook for managing form validation
 * @param {Object} params - { initialValues, validateFn, options }
 *  - initialValues: Object of field names to initial values
 *  - validateFn(values): Function returning an errors object keyed by field
 *  - options: Optional configuration { validateOnBlur, validateOnChangeTouched }
 * @returns {Object} - Form state and handlers
 */
const useFormValidation = (paramsOrInitialValues, maybeValidateFn) => {
  // Backward compatibility: (initialValues, validateFn)
  const isLegacySignature = !paramsOrInitialValues || typeof paramsOrInitialValues === 'object' && typeof maybeValidateFn === 'function' && !paramsOrInitialValues.validateFn;
  const {
    initialValues,
    validateFn,
    options = defaultOptions,
  } = isLegacySignature
    ? { initialValues: paramsOrInitialValues, validateFn: maybeValidateFn, options: defaultOptions }
    : paramsOrInitialValues;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(options.initialErrors || {});
  const [touched, setTouched] = useState(options.initialTouched || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when input changes
  const handleChange = useCallback((e) => {
    const { name } = e.target;
    const fieldValue = getFieldValue(e);
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // If field was touched, validate on change
    if (options.validateOnChangeTouched && touched[name]) {
      const validationErrors = validateFn({
        ...values,
        [name]: fieldValue
      });
      
      setErrors(prev => ({
        ...prev,
        [name]: validationErrors[name]
      }));
    }
  }, [values, touched, validateFn, options.validateOnChangeTouched]);

  // Mark field as touched when blur event occurs
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field on blur
    if (options.validateOnBlur) {
      const validationErrors = validateFn(values);
      setErrors(prev => ({
        ...prev,
        [name]: validationErrors[name]
      }));
    }
  }, [values, validateFn, options.validateOnBlur]);

  // Validate all fields and prepare for submission
  const handleSubmit = useCallback(async (eOrOnSubmit, maybeOnSubmit) => {
    const e = (eOrOnSubmit && eOrOnSubmit.preventDefault) ? eOrOnSubmit : null;
    const onSubmit = e ? maybeOnSubmit : eOrOnSubmit;
    if (e) e.preventDefault();
    
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
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors(prev => ({
          ...prev,
          form: error.message || 'An error occurred during form submission'
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

  /**
   * Manually set a field value and trigger validation if configured
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (options.validateOnChangeTouched && touched[name]) {
      const validationErrors = validateFn({ ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  }, [touched, validateFn, values, options.validateOnChangeTouched]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setFieldValue
  };
};

export default useFormValidation;