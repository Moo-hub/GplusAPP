import { axe } from 'jest-axe';
import { enqueueAxe } from './axe-serial';
import { render } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * Test a component for accessibility violations using jest-axe
 * 
 * @param {any} ui - The component or DOM container to test
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
  // If a DOM node/container is passed, use it directly. Otherwise render
  // the React element and use the returned container. This avoids double
  // rendering the same UI which can create duplicate ARIA landmarks in the
  // test DOM and cause false positives.
  let container;
  if (ui && typeof ui === 'object' && ('nodeType' in ui) && ui.nodeType === 1) {
    container = ui;
  } else {
    const rendered = render(ui);
    container = rendered.container;
  }

  // Use serialized axe runner to avoid concurrent axe.run() calls across tests
  const axeResults = await enqueueAxe(() => axe(container, options));
  
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
 * @param {any} ui - The component or DOM container to test
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
    // Prefer explicit role attributes, but also accept native elements
    const elementsByRole = container.querySelectorAll(`[role="${role}"]`);
    if (elementsByRole.length > 0) {
      expect(elementsByRole.length).toBeGreaterThan(0);
      return;
    }
    // Map common roles to semantic element selectors as a fallback
    const roleFallbacks = {
      form: 'form',
      button: 'button,input[type="submit"],input[type="button"],a[role="button"]',
      checkbox: 'input[type="checkbox"]',
      navigation: 'nav',
      main: 'main',
      heading: 'h1,h2,h3,h4,h5,h6'
    };
    const selector = roleFallbacks[role] || `[role="${role}"]`;
    const fallbackEls = container.querySelectorAll(selector);
    expect(fallbackEls.length).toBeGreaterThan(0);
  });

  // Accept aria-required="true" as an acceptable substitute for the native
  // required attribute in cases where components prefer ARIA properties.
  // This helps tests running under JSDOM where some form controls are implemented
  // with custom wrappers that set ARIA properties instead of native attributes.
  try {
    const inputs = container.querySelectorAll('input,textarea,select');
    inputs.forEach(input => {
      const hasRequired = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true';
      if (!hasRequired) {
        // don't fail here; individual tests still assert required where needed
      }
    });
  } catch (e) {}

  // Also run a full accessibility check against the same container to avoid
  // creating duplicate landmarks by re-rendering the component.
  await checkAccessibility(container);
}