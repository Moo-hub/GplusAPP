import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { enqueueAxe } from '../../utils/test-utils/axe-serial';
import Card from '../Card';
import Button from '../Button';
import { MemoryRouter, Link } from 'react-router-dom';

// Configure jest-axe
const customAxe = configureAxe({
  rules: {
    // You can enable or disable specific rules here
    'color-contrast': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true }
  }
});

// Helper function to check accessibility
async function checkA11y(container) {
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
}

describe('Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });
  
  describe('Button Component', () => {
    it('should have no accessibility violations with default variant', async () => {
    const { container } = render(<Button onClick={() => {}} ariaLabel="Click Me">Click Me</Button>);
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with primary variant', async () => {
    const { container } = render(<Button onClick={() => {}} ariaLabel="Primary Button" variant="primary">Primary Button</Button>);
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations when disabled', async () => {
    const { container } = render(<Button onClick={() => {}} ariaLabel="Disabled Button" disabled>Disabled Button</Button>);
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with aria attributes', async () => {
      const { container } = render(
        <Button onClick={() => {}} ariaLabel="Custom action" aria-haspopup="true">
          Action Menu
        </Button>
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
  });
  
  describe('Card Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card title="Accessibility Test Card" onClick={() => {}}>
          <p>This is some content inside the card.</p>
        </Card>
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with custom heading level', async () => {
      const { container } = render(
        <Card title="Custom Heading" onClick={() => {}}>
          <p>Card with a custom heading level.</p>
        </Card>
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });
  });
  
  describe('Navigation Accessibility', () => {
    it('should have no accessibility violations in navigation links', async () => {
      const { container } = render(
        <MemoryRouter>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </MemoryRouter>
      );
      const results = await enqueueAxe(() => customAxe(container));
      expect(results).toHaveNoViolations();
    });
  });
});