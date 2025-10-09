import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkAccessibility, testKeyboardWorkflow } from '../utils/test-utils/a11y-testing';
import CollapsibleSection from './CollapsibleSection';

describe('CollapsibleSection Accessibility', () => {
  const mockContent = 'This is the collapsible content';
  const mockTitle = 'Collapsible Section Title';
  
  it('should not have accessibility violations', async () => {
    await checkAccessibility(
      <CollapsibleSection id="test-section" title={mockTitle}>
        {mockContent}
      </CollapsibleSection>
    );
  });
  
  it('should have appropriate ARIA attributes', () => {
    render(
      <CollapsibleSection id="test-section" title={mockTitle}>
        {mockContent}
      </CollapsibleSection>
    );
    
    const button = screen.getByRole('button');
    const region = button.getAttribute('aria-controls');
    
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(region)).toHaveAttribute('aria-labelledby', button.id);
  });
  
  it('should allow keyboard-only interaction', async () => {
    await testKeyboardWorkflow(
      <CollapsibleSection id="test-section" title={mockTitle}>
        {mockContent}
      </CollapsibleSection>,
      async (user) => {
        await user.tab(); // Focus the button
        await user.keyboard('{Enter}'); // Expand the section
      },
      () => {
        const button = screen.getByRole('button');
        const contentId = button.getAttribute('aria-controls');
        const contentElement = document.getElementById(contentId);
        
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(contentElement).not.toHaveAttribute('hidden');
        expect(contentElement).toHaveTextContent(mockContent);
      }
    );
  });
  
  it('should focus the header button when collapsed', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection id="test-section" title={mockTitle} initialExpanded={true}>
        {mockContent}
      </CollapsibleSection>
    );
    
    const button = screen.getByRole('button');
    
    // Click to collapse
    await user.click(button);
    
    // Check that button has focus
    expect(document.activeElement).toBe(button);
  });
  
  it('should correctly update aria-expanded attribute', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection id="test-section" title={mockTitle}>
        {mockContent}
      </CollapsibleSection>
    );
    
    const button = screen.getByRole('button');
    
    // Initially collapsed
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Click to expand
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Click to collapse
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});