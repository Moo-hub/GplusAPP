import { axe } from 'jest-axe';
import { render } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * Test a component for accessibility violations using jest-axe
 * 
 * @param {React.ReactElement} ui - The component to test
 * @param {Object} options - Options to pass to axe
 * @returns {Promise<void>} - Promise that resolves when accessibility testing is complete
 * 
 * @example
 * ```jsx
 * it('should not have accessibility violations', async () => {
 *   await checkAccessibility(<MyComponent />);
 * });
 * ```
 */
export async function checkAccessibility(ui, options = {}) {
  const { container } = render(ui);
  const axeResults = await axe(container, options);
  
  // Custom error message with more details about violations
  if (axeResults.violations.length > 0) {
    const violationMessages = axeResults.violations.map(violation => {
      return `
        Rule: ${violation.id} (${violation.impact} impact)
        Description: ${violation.description}
        Help: ${violation.help}
        Elements: ${violation.nodes.length} element(s) affected
        ${violation.nodes.map(node => `  - ${node.html}`).join('\n')}
      `;
    }).join('\n');
    
    throw new Error(`Accessibility violations found:\n${violationMessages}`);
  }
  
  // If we get here, no violations were found
  expect(axeResults.violations).toHaveLength(0);
}

/**
 * Run accessibility tests for a component with specific roles
 * 
 * @param {React.ReactElement} ui - The component to test
 * @param {Array<string>} expectedRoles - The ARIA roles expected to be in the component
 * @returns {Promise<void>} - Promise that resolves when accessibility testing is complete
 * 
 * @example
 * ```jsx
 * it('should have proper button roles', async () => {
 *   await checkAccessibilityRoles(<MyComponent />, ['button', 'heading']);
 * });
 * ```
 */
export async function checkAccessibilityRoles(ui, expectedRoles) {
  const { container } = render(ui);
  
  // Check for each expected role
  expectedRoles.forEach(role => {
    const elements = container.querySelectorAll(`[role="${role}"]`);
    expect(elements.length).toBeGreaterThan(0);
  });
  
  // Also run a full accessibility check
  await checkAccessibility(ui);
}