import React from "react";
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ScreenReaderOnly from '../ScreenReaderOnly';

describe('ScreenReaderOnly Component', () => {
  it('renders children with sr-only class', () => {
    // Arrange
    const testText = 'This text is for screen readers only';

    // Act
    render(<ScreenReaderOnly>{testText}</ScreenReaderOnly>);
    
    // Assert
    const srElement = screen.getByText(testText);
    expect(srElement).toBeInTheDocument();
    expect(srElement).toHaveClass('sr-only');
  });

  it('is not visually hidden in tests but would be in browser', () => {
    // This test verifies the component accepts children and renders them
    // The actual CSS hiding happens in the stylesheet, which isn't applied in JSDOM
    
    // Arrange
    const complexContent = (
      <div data-testid="complex-content">
        <span>Screen reader</span>
        <strong>Only</strong>
      </div>
    );

    // Act
    render(<ScreenReaderOnly>{complexContent}</ScreenReaderOnly>);
    
    // Assert
    const content = screen.getByTestId('complex-content');
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveClass('sr-only');
  });

  it('maintains text content hierarchy', () => {
    // Arrange
    const nestedContent = (
      <>
        <h2>Screen Reader Heading</h2>
        <p>Screen reader paragraph</p>
      </>
    );

    // Act
    render(<ScreenReaderOnly>{nestedContent}</ScreenReaderOnly>);
    
    // Assert
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Screen reader paragraph')).toBeInTheDocument();
  });
});