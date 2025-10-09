/**
 * @file useLocalizedStorage.js - هوك مخصص لتخزين واسترجاع البيانات المترجمة من localStorage
 * @module hooks/useLocalizedStorage
 */

import { useState, useCallback } from 'react';
import { useLanguage } from '../i18nSetup';

/**
 * هوك مخصص لتخزين واسترجاع البيانات المترجمة في localStorage
 * يحتفظ بالبيانات لكل لغة بشكل منفصل
 *
 * @param {string} key - مفتاح التخزين الأساسي
 * @param {*} defaultValue - القيمة الافتراضية إذا لم يتم العثور على بيانات
 * @returns {Array} مصفوفة تحتوي على القيمة المخزنة ووظائف التحديث
 */
const useLocalizedStorage = (key, defaultValue) => {
  // الحصول على اللغة الحالية
  const { language } = useLanguage();
  
  // إنشاء مفتاح فريد للغة الحالية
  const localizedKey = `${key}_${language}`;
  
  // وظيفة لقراءة القيمة المخزنة
  const readValue = useCallback(() => {
    // التحقق من وجود localStorage
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      // محاولة قراءة القيمة من localStorage
      const item = window.localStorage.getItem(localizedKey);
      
      // إرجاع القيمة المحفوظة إذا وجدت، أو الافتراضية إذا لم توجد
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${localizedKey}":`, error);
      return defaultValue;
    }
  }, [localizedKey, defaultValue]);
  
  // إنشاء حالة مع القيمة الأولية من localStorage أو القيمة الافتراضية
  const [storedValue, setStoredValue] = useState(readValue);
  
  // وظيفة لتحديث القيمة المخزنة
  const setValue = useCallback(value => {
    // التحقق من وجود localStorage
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key "${localizedKey}" even though environment is not a client`);
      return;
    }
    
    try {
      // تخزين القيمة في الحالة
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      
      // تخزين القيمة في localStorage
      window.localStorage.setItem(localizedKey, JSON.stringify(newValue));
      
      // إطلاق حدث للإشعار بتغيير التخزين
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.warn(`Error setting localStorage key "${localizedKey}":`, error);
    }
  }, [localizedKey, storedValue]);
  
  // وظيفة لإزالة القيمة من localStorage
  const removeValue = useCallback(() => {
    // التحقق من وجود localStorage
    if (typeof window === 'undefined') {
      console.warn(`Tried removing localStorage key "${localizedKey}" even though environment is not a client`);
      return;
    }
    
    try {
      // إزالة القيمة من localStorage
      window.localStorage.removeItem(localizedKey);
      
      // إعادة تعيين القيمة المخزنة إلى القيمة الافتراضية
      setStoredValue(defaultValue);
      
      // إطلاق حدث للإشعار بتغيير التخزين
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.warn(`Error removing localStorage key "${localizedKey}":`, error);
    }
  }, [localizedKey, defaultValue]);
  
  // إرجاع القيمة المخزنة ووظائف التحديث
  return [storedValue, setValue, removeValue];
};

export default useLocalizedStorage;