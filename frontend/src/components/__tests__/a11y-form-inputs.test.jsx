import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { enqueueAxe } from '../../utils/test-utils/axe-serial';
import { checkAccessibilityRoles } from '../../utils/test-utils/accessibility';
import TextField from '../TextField';
import Checkbox from '../Checkbox';
import Select from '../Select';

// Configure jest-axe
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'autocomplete-valid': { enabled: true }
  }
});

describe('Form Input Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  describe('TextField Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TextField
          id="test-input"
          label="Test Input"
          name="testInput"
          error={null}
          required={false}
        />
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });

    it('should have proper accessibility with error state', async () => {
      const { container } = render(
        <TextField
          id="error-input"
          label="Error Input"
          name="errorInput"
          error="This field has an error"
          required={false}
        />
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();

      // Check that the input has the appropriate aria-invalid attribute
      const input = container.querySelector('input');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      
      // Check that the error message is properly associated with the input
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).not.toBeNull();
      
      const errorElement = document.getElementById(errorId);
      expect(errorElement).not.toBeNull();
      expect(errorElement.textContent).toBe('This field has an error');
    });

    it('should have proper accessibility with required attribute', async () => {
      const { container } = render(
        <TextField
          id="required-input"
          label="Required Input"
          name="requiredInput"
          required
          error={null}
        />
      );
      
      // Check that the input has the required attribute
      const input = container.querySelector('input');
      expect(input.hasAttribute('required')).toBe(true);
      
      // Check that the label indicates the field is required
      const label = container.querySelector('label');
      expect(label.textContent).toContain('*');
    });
  });

  describe('Checkbox Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Checkbox
          id="test-checkbox"
          label="Test Checkbox"
          name="testCheckbox"
        />
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });

    it('should have proper accessibility roles', async () => {
      await checkAccessibilityRoles(
        <Checkbox
          id="role-checkbox"
          label="Role Checkbox"
          name="roleCheckbox"
        />,
        ['checkbox']
      );
    });
  });

  describe('Select Component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Select
          id="test-select"
          label="Test Select"
          name="testSelect"
          options={options}
        />
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });

    it('should have proper accessibility with disabled options', async () => {
      const optionsWithDisabled = [
        ...options,
        { value: 'option4', label: 'Option 4', disabled: true }
      ];

      const { container } = render(
        <Select
          id="disabled-option-select"
          label="Select with Disabled Option"
          name="disabledOptionSelect"
          options={optionsWithDisabled}
        />
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();

      // Check that the disabled option has the disabled attribute
      const disabledOption = container.querySelector('option[value="option4"]');
      expect(disabledOption.hasAttribute('disabled')).toBe(true);
    });
  });
});