import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Spy on classList.toggle method
    vi.spyOn(document.body.classList, 'toggle');
  });
  
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });
  
  it('renders the theme toggle button', () => {
    render(<ThemeToggle />);
    
    // Check that the toggle button is rendered
    const toggleButton = screen.getByTestId('theme-toggle-button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('theme-toggle');
    expect(toggleButton).toHaveTextContent('🌓');
  });
  
  it('toggles the dark theme when clicked', () => {
    render(<ThemeToggle />);
    
    // Find and click the toggle button
    const toggleButton = screen.getByTestId('theme-toggle-button');
    fireEvent.click(toggleButton);
    
    // Check that classList.toggle was called with the right argument
    expect(document.body.classList.toggle).toHaveBeenCalledTimes(1);
    expect(document.body.classList.toggle).toHaveBeenCalledWith('dark-theme');
  });
});