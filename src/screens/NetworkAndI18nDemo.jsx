/**
 * @file NetworkAndI18nDemo.jsx - صفحة عرض توضيحي لتكامل ترجمة واجهة المستخدم وحالة الشبكة
 * @module screens/NetworkAndI18nDemo
 */

import React, { useState } from 'react';
import useTranslationNamespaces from '../hooks/useTranslationNamespaces';
import { useLanguage } from '../i18nSetup';
import LanguageSelector from '../components/common/LanguageSelector';
import NetworkStatus from '../components/common/NetworkStatus';
import { useDirectionalStyles } from '../utils/directionalHelpers';

/**
 * صفحة عرض توضيحي لتكامل ترجمة واجهة المستخدم وحالة الشبكة
 *
 * @returns {React.ReactElement} صفحة العرض التوضيحي
 */
const NetworkAndI18nDemo = () => {
  const { t } = useTranslationNamespaces(['common', 'network']);
  const { language, direction, isRTL } = useLanguage();
  const directionalStyles = useDirectionalStyles();
  
  // حالة لاختيار نوع عرض مكون حالة الشبكة
  const [networkVariant, setNetworkVariant] = useState('inline');
  
  return (
    <div className={`container ${isRTL ? 'rtl' : 'ltr'}`} style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <NetworkStatus variant="banner" />
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">{t('Network Status & Internationalization Demo')}</h2>
        </div>
        <div className="card-body">
          <div className="language-selector-container mb-4">
            <h3>{t('language.selectLanguage')}</h3>
            <LanguageSelector variant="buttons" />
          </div>
          
          <hr />
          
          <div className="current-language mb-4">
            <h3>{t('Current Language Settings')}</h3>
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th style={{ width: '150px' }}>{t('Language')}</th>
                  <td>{language}</td>
                </tr>
                <tr>
                  <th>{t('Direction')}</th>
                  <td>{direction}</td>
                </tr>
                <tr>
                  <th>{t('Is RTL')}</th>
                  <td>{isRTL ? t('Yes') : t('No')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <hr />
          
          <div className="network-status-demo mb-4">
            <h3>{t('Network Status Examples')}</h3>
            
            <div className="form-group mb-3">
              <label htmlFor="variant-selector">{t('Select Display Variant')}</label>
              <select
                id="variant-selector"
                className="form-control"
                value={networkVariant}
                onChange={(e) => setNetworkVariant(e.target.value)}
              >
                <option value="inline">Inline</option>
                <option value="banner">Banner</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            
            <div className="network-status-container p-3 border rounded">
              <h4>{t('Current Network Status')}</h4>
              <NetworkStatus variant={networkVariant} />
            </div>
          </div>
          
          <hr />
          
          <div className="direction-examples mb-4">
            <h3>{t('Directional Examples')}</h3>
            
            <div className="example-container mb-3">
              <h4>{t('Text Alignment')}</h4>
              <p style={directionalStyles.textAlign('start')}>{t('This text is aligned to the start')}</p>
              <p style={directionalStyles.textAlign('end')}>{t('This text is aligned to the end')}</p>
            </div>
            
            <div className="example-container mb-3">
              <h4>{t('Margin & Padding')}</h4>
              <div style={{ 
                ...directionalStyles.margin('20px', '50px'), 
                ...directionalStyles.padding('10px', '30px'),
                background: '#f5f5f5',
                border: '1px solid #ddd',
              }}>
                {t('This box has different margin and padding values based on the current language direction')}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header bg-info text-white">
          <h3 className="mb-0">{t('Translation Examples')}</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h4>{t('navigation.title', 'Navigation')}</h4>
              <ul className="list-group">
                <li className="list-group-item">{t('navigation.home')}</li>
                <li className="list-group-item">{t('navigation.dashboard')}</li>
                <li className="list-group-item">{t('navigation.settings')}</li>
              </ul>
            </div>
            
            <div className="col-md-6">
              <h4>{t('actions.title', 'Actions')}</h4>
              <div className="d-grid gap-2">
                <button className="btn btn-primary">{t('actions.save')}</button>
                <button className="btn btn-secondary">{t('actions.cancel')}</button>
                <button className="btn btn-danger">{t('actions.delete')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkAndI18nDemo;