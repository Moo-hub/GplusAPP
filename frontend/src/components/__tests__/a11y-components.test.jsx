import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import Button from '../Button';
import Card from '../Card';
import { MemoryRouter } from 'react-router-dom';

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
  const results = await customAxe(container);
  expect(results).toHaveNoViolations();
}

describe('Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });
  
  describe('Button Component', () => {
    it('should have no accessibility violations with default variant', async () => {
      const { container } = render(<Button>Click Me</Button>);
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with primary variant', async () => {
      const { container } = render(<Button variant="primary">Primary Button</Button>);
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with aria attributes', async () => {
      const { container } = render(
        <Button aria-label="Custom action" aria-haspopup="true">
          Action Menu
        </Button>
      );
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('Card Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card title="Accessibility Test Card">
          <p>This is some content inside the card.</p>
        </Card>
      );
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('should have no accessibility violations with custom heading level', async () => {
      const { container } = render(
        <Card title="Custom Heading" headingLevel={3}>
          <p>Card with a custom heading level.</p>
        </Card>
      );
      const results = await customAxe(container);
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
      const results = await customAxe(container);
      expect(results).toHaveNoViolations();
    });
  });
});