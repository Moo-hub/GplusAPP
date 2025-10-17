/**
 * @file directionalHelpers.test.jsx - اختبارات وحدة لأدوات مساعدة الاتجاه متعدد اللغات
 * @module utils/__tests__/directionalHelpers.test
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DirectionalContent,
  DirectionalFlow,
  useDirectionalValue,
  useDirectionalStyles,
  getDirectionalClassName
} from '../directionalHelpers';
import * as i18nSetupModule from '../../i18nSetup';

// محاكاة useLanguage من i18nSetup
vi.mock('../../i18nSetup', () => ({
  useLanguage: vi.fn()
}));

// مكون اختبار لـ useDirectionalValue
const TestDirectionalValue = ({ ltrValue, rtlValue }) => {
  const value = useDirectionalValue(ltrValue, rtlValue);
  return <div data-testid="value">{value}</div>;
};

// مكون اختبار لـ useDirectionalStyles
const TestDirectionalStyles = () => {
  const directionalStyles = useDirectionalStyles();
  
  return (
    <div>
      <div data-testid="margin" style={directionalStyles.margin('10px', '20px')}>Margin Test</div>
      <div data-testid="padding" style={directionalStyles.padding('10px', '20px')}>Padding Test</div>
      <div data-testid="text-align-start" style={directionalStyles.textAlign('start')}>Text Align Start</div>
      <div data-testid="text-align-end" style={directionalStyles.textAlign('end')}>Text Align End</div>
      <div data-testid="text-align-center" style={directionalStyles.textAlign('center')}>Text Align Center</div>
      <div data-testid="direction" style={directionalStyles.direction()}>Direction Test</div>
    </div>
  );
};

describe('Directional Helpers', () => {
  beforeEach(() => {
    // إعادة تعيين محاكاة useLanguage إلى القيم الافتراضية (LTR)
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'en',
      direction: 'ltr',
      isRTL: false
    });
  });

  describe('DirectionalContent', () => {
    it('should render LTR content when direction is LTR', () => {
      render(
        <DirectionalContent
          ltr={<div data-testid="ltr-content">LTR Content</div>}
          rtl={<div data-testid="rtl-content">RTL Content</div>}
        />
      );
      
      expect(screen.queryByTestId('ltr-content')).toBeInTheDocument();
      expect(screen.queryByTestId('rtl-content')).not.toBeInTheDocument();
    });
    
    it('should render RTL content when direction is RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(
        <DirectionalContent
          ltr={<div data-testid="ltr-content">LTR Content</div>}
          rtl={<div data-testid="rtl-content">RTL Content</div>}
        />
      );
      
      expect(screen.queryByTestId('rtl-content')).toBeInTheDocument();
      expect(screen.queryByTestId('ltr-content')).not.toBeInTheDocument();
    });
  });

  describe('DirectionalFlow', () => {
    it('should apply normal flex direction in LTR mode', () => {
      render(
        <DirectionalFlow>
          <div>Item 1</div>
          <div>Item 2</div>
        </DirectionalFlow>
      );
      
      const container = screen.getByText('Item 1').parentElement;
      
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'row'
      });
    });
    
    it('should reverse flex direction in RTL mode', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(
        <DirectionalFlow>
          <div>Item 1</div>
          <div>Item 2</div>
        </DirectionalFlow>
      );
      
      const container = screen.getByText('Item 1').parentElement;
      
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'row-reverse'
      });
    });
  });

  describe('useDirectionalValue', () => {
    it('should return LTR value when direction is LTR', () => {
      render(<TestDirectionalValue ltrValue="LTR Value" rtlValue="RTL Value" />);
      
      expect(screen.getByTestId('value')).toHaveTextContent('LTR Value');
    });
    
    it('should return RTL value when direction is RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(<TestDirectionalValue ltrValue="LTR Value" rtlValue="RTL Value" />);
      
      expect(screen.getByTestId('value')).toHaveTextContent('RTL Value');
    });
  });

  describe('useDirectionalStyles', () => {
    it('should return correct margin styles for LTR', () => {
      render(<TestDirectionalStyles />);
      
      const element = screen.getByTestId('margin');
      
      expect(element).toHaveStyle({
        marginLeft: '10px',
        marginRight: '20px'
      });
    });
    
    it('should return correct padding styles for LTR', () => {
      render(<TestDirectionalStyles />);
      
      const element = screen.getByTestId('padding');
      
      expect(element).toHaveStyle({
        paddingLeft: '10px',
        paddingRight: '20px'
      });
    });
    
    it('should return correct text alignment for LTR', () => {
      render(<TestDirectionalStyles />);
      
      expect(screen.getByTestId('text-align-start')).toHaveStyle({ textAlign: 'left' });
      expect(screen.getByTestId('text-align-end')).toHaveStyle({ textAlign: 'right' });
      expect(screen.getByTestId('text-align-center')).toHaveStyle({ textAlign: 'center' });
    });
    
    it('should return correct direction for LTR', () => {
      render(<TestDirectionalStyles />);
      
      expect(screen.getByTestId('direction')).toHaveStyle({ direction: 'ltr' });
    });
    
    it('should return swapped margin styles for RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(<TestDirectionalStyles />);
      
      const element = screen.getByTestId('margin');
      
      expect(element).toHaveStyle({
        marginLeft: '20px',
        marginRight: '10px'
      });
    });
    
    it('should return swapped padding styles for RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(<TestDirectionalStyles />);
      
      const element = screen.getByTestId('padding');
      
      expect(element).toHaveStyle({
        paddingLeft: '20px',
        paddingRight: '10px'
      });
    });
    
    it('should return swapped text alignment for RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(<TestDirectionalStyles />);
      
      expect(screen.getByTestId('text-align-start')).toHaveStyle({ textAlign: 'right' });
      expect(screen.getByTestId('text-align-end')).toHaveStyle({ textAlign: 'left' });
      // center should remain center
      expect(screen.getByTestId('text-align-center')).toHaveStyle({ textAlign: 'center' });
    });
    
    it('should return correct direction for RTL', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      render(<TestDirectionalStyles />);
      
      expect(screen.getByTestId('direction')).toHaveStyle({ direction: 'rtl' });
    });
  });

  describe('getDirectionalClassName', () => {
    it('should return class with LTR suffix in LTR mode', () => {
      // تنفيذ الاختبار مباشرة بدون الحاجة إلى الـ render
      const className = getDirectionalClassName('base-class');
      expect(className).toBe('base-class base-class-ltr');
    });
    
    it('should return class with RTL suffix in RTL mode', () => {
      // تغيير محاكاة useLanguage إلى RTL
      i18nSetupModule.useLanguage.mockReturnValue({
        language: 'ar',
        direction: 'rtl',
        isRTL: true
      });
      
      const className = getDirectionalClassName('base-class');
      expect(className).toBe('base-class base-class-rtl');
    });
  });
});