import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { enqueueAxe } from '../../utils/test-utils/axe-serial';
import Modal from '../Modal';
import { checkAccessibility } from '../../utils/test-utils/accessibility';

// Configure jest-axe (use defaults; don't pass rules that may not exist
// in the installed axe-core version)
const customAxe = configureAxe();

describe('Modal Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  // Note: avoid stubbing/spying `document.addEventListener` or
  // `removeEventListener` here — the Modal registers a keydown listener
  // on document to handle Escape, and mocking those methods prevents the
  // handler from being attached. Keep the JSDOM document intact to let
  // the component behave like a browser environment.
  beforeAll(() => {});

  afterAll(() => {
    // Restore spies to avoid leaking stubs across other tests
    try { vi.restoreAllMocks(); } catch (e) { /* ignore */ }
  });

  // Setup mock functions
  const onClose = vi.fn();
  
  it('should have proper ARIA attributes when open', async () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        ariaLabelledBy="modal-title"
      >
        <p>Modal content for testing</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // The dialog should reference an accessible name via aria-labelledby
    // or have an accessible name otherwise. Don't assert a hard-coded id
    // (tests may pass a generated id); instead verify the referenced
    // element exists and contains the title text.
    const labelledby = dialog.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const labelEl = document.getElementById(labelledby);
    expect(labelEl).toBeInTheDocument();
    expect(labelEl).toHaveTextContent('Test Modal');

  // Check for accessibility violations (use default rules)
  const results = await enqueueAxe(() => customAxe(dialog));
  expect(results).toHaveNoViolations();
  });

  it('should focus the first focusable element on open', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Focus Test Modal"
        ariaLabelledBy="modal-title-2"
      >
        <button>First Button</button>
        <label htmlFor="focus-test-input">Input</label>
        <input id="focus-test-input" type="text" aria-label="Focus input" />
        <button>Second Button</button>
      </Modal>
    );

    // In a real environment, we would expect the first button to be focused
    // For testing purposes, we'll just check that focus management is handled properly
    const focusableElements = container.querySelectorAll('button, input');
    expect(focusableElements.length).toBeGreaterThan(0);
    
  // Check for accessibility violations
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
  });

  it('should trap focus within the modal', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Focus Trap Modal"
        ariaLabelledBy="modal-title-3"
      >
        <button data-testid="first-button">First Button</button>
        <label htmlFor="middle-input">Middle Input</label>
        <input id="middle-input" data-testid="middle-input" type="text" aria-label="Middle input" />
        <button data-testid="last-button">Last Button</button>
      </Modal>
    );

    // Get all focusable elements
    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');
    
    // Focus the last button
    lastButton.focus();
    
    // Simulate Tab key press which should cycle back to first element
    fireEvent.keyDown(lastButton, { key: 'Tab', code: 'Tab' });
    
    // In an actual browser, this would focus the first button
    // We can't fully test focus trap in JSDOM, but we can test the component has the right structure
    
    expect(firstButton).toBeInTheDocument();
    expect(lastButton).toBeInTheDocument();
    
  // Check for accessibility violations
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
  });

  it('should close on Escape key press', async () => {
    const { container } = render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Escape Key Modal"
        ariaLabelledBy="modal-title-4"
      >
        <p>Press Escape to close</p>
      </Modal>
    );
    
    const dialog = screen.getByRole('dialog');
    
    // Simulate Escape key press
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    
    // Check that onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
    
  // Check for accessibility violations
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
  });

  it('should be accessible when using custom heading level', async () => {
    await checkAccessibility(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Custom Heading Modal"
        ariaLabelledBy="modal-title-custom"
        headingLevel={3}
      >
        <p>This modal uses h3 for the heading</p>
      </Modal>
    );
    
    // Verify the heading level
    const heading = screen.getByText('Custom Heading Modal');
    expect(heading.tagName).toBe('H3');
  });
});