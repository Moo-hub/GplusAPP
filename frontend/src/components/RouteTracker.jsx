import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Analytics } from '../services/analyticsService';

const RouteTracker = ({ children }) => {
  const location = useLocation();
  
  // تتبع تغييرات المسار
  useEffect(() => {
    // الحصول على اسم الصفحة من المسار
    const pageName = location.pathname.split('/')[1] || 'home';
    
    // تسجيل مشاهدة الصفحة
    Analytics.pageView(
      pageName.charAt(0).toUpperCase() + pageName.slice(1), // تحويل أول حرف إلى حرف كبير
      location.pathname
    );
  }, [location]);
  
  return <>{children}</>;
};

export default RouteTracker;

RouteTracker.propTypes = {
  children: PropTypes.node.isRequired
};