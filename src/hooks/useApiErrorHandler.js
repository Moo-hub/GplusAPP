import { useTranslation } from 'react-i18next';
import { useToast } from '../components/toast/Toast';

// Custom hook for centralized API error handling
const useApiErrorHandler = () => {
  const { t } = useTranslation();
  const { showError } = useToast();

  // Main error handler function
  const handleApiError = (error, customMessage = null) => {
    console.error('API Error:', error);
    
    let errorMessage = customMessage;

    if (!errorMessage) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const statusCode = error.response.status;
        const serverMessage = error.response.data?.message;
        
        switch (statusCode) {
          case 400:
            errorMessage = serverMessage || t('errors.badRequest');
            break;
          case 401:
            errorMessage = serverMessage || t('errors.unauthorized');
            break;
          case 403:
            errorMessage = serverMessage || t('errors.forbidden');
            break;
          case 404:
            errorMessage = serverMessage || t('errors.notFound');
            break;
          case 422:
            errorMessage = serverMessage || t('errors.validationError');
            break;
          case 429:
            errorMessage = t('errors.tooManyRequests');
            break;
          case 500:
            errorMessage = t('errors.serverError');
            break;
          default:
            errorMessage = serverMessage || t('errors.somethingWentWrong');
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = t('errors.noResponse');
      } else {
        // Something happened in setting up the request
        errorMessage = t('errors.requestSetupError');
      }
    }

    // Display the error toast
    showError(errorMessage);

    return {
      message: errorMessage,
      originalError: error
    };
  };

  return { handleApiError };
};

export default useApiErrorHandler;