/**
 * Accessibility Testing Utility
 * 
 * This script provides helper functions to test the accessibility of our React components
 * extending the existing accessibility.js utility with more specific test functions.
 */

import { checkAccessibility } from './accessibility';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test keyboard navigation through a set of elements
 * 
 * @param {React.ReactElement} ui - The component to test
 * @param {Array<string>} expectedTabOrder - Array of test IDs in expected tab order
 * @returns {Promise<void>} - Promise that resolves when testing is complete
 * 
 * @example
 * ```jsx
 * it('should have correct tab order', async () => {
 *   await testTabOrder(<MyForm />, ['email-input', 'password-input', 'submit-button']);
 * });
 * ```
 */
export async function testTabOrder(ui, expectedTabOrder) {
  render(ui);
  const user = userEvent.setup();
  
  // Start by tabbing to the first element
  await user.tab();
  
  // Check if the focused element matches the expected element in the tab order
  for (let i = 0; i < expectedTabOrder.length; i++) {
    const currentFocused = document.activeElement;
    const expectedElement = screen.getByTestId(expectedTabOrder[i]);
    expect(currentFocused).toBe(expectedElement);
    
    // Tab to the next element if not at the end
    if (i < expectedTabOrder.length - 1) {
      await user.tab();
    }
  }
}

/**
 * Test screen reader announcements using aria-live regions
 * 
 * @param {React.ReactElement} ui - The component to test
 * @param {Function} triggerAction - Function to trigger the announcement
 * @param {string} expectedAnnouncement - The text expected to be announced
 * @param {string} liveRegionTestId - The test ID of the live region
 * @returns {Promise<void>} - Promise that resolves when testing is complete
 * 
 * @example
 * ```jsx
 * it('should announce form errors', async () => {
 *   await testScreenReaderAnnouncement(
 *     <LoginForm />,
 *     async (user) => {
 *       await user.click(screen.getByRole('button', { name: 'Submit' }));
 *     },
 *     'Please fix the errors in the form',
 *     'error-live-region'
 *   );
 * });
 * ```
 */
export async function testScreenReaderAnnouncement(
  ui,
  triggerAction,
  expectedAnnouncement,
  liveRegionTestId
) {
  const { user } = render(ui);
  
  // Trigger the action that should cause the announcement
  await triggerAction(userEvent.setup());
  
  // Check if the live region contains the expected text
  const liveRegion = screen.getByTestId(liveRegionTestId);
  expect(liveRegion).toHaveTextContent(expectedAnnouncement);
}

/**
 * Test that a component can be used exclusively with keyboard
 * 
 * @param {React.ReactElement} ui - The component to test
 * @param {Function} keyboardWorkflow - Function to perform keyboard interactions
 * @param {Function} assertion - Function to verify the expected outcome
 * @returns {Promise<void>} - Promise that resolves when testing is complete
 * 
 * @example
 * ```jsx
 * it('should allow keyboard-only interaction', async () => {
 *   await testKeyboardWorkflow(
 *     <Dropdown options={['Option 1', 'Option 2']} />,
 *     async (user) => {
 *       await user.tab(); // Focus the dropdown
 *       await user.keyboard('{Enter}'); // Open dropdown
 *       await user.keyboard('{ArrowDown}'); // Select next option
 *       await user.keyboard('{Enter}'); // Choose option
 *     },
 *     () => {
 *       expect(screen.getByText('Selected: Option 2')).toBeInTheDocument();
 *     }
 *   );
 * });
 * ```
 */
export async function testKeyboardWorkflow(ui, keyboardWorkflow, assertion) {
  const { user } = render(ui);
  
  // Perform the keyboard workflow
  await keyboardWorkflow(userEvent.setup());
  
  // Run the assertion
  assertion();
  
  // Also check for general accessibility
  await checkAccessibility(ui);
}

export { checkAccessibility };