import React from 'react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import PickupRequestForm from '../components/PickupRequestForm';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

// Mock the react-router hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock the react-query hooks
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn()
}));

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

// Mock the toast notifications
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('PickupRequestForm Component', () => {
  const mockNavigate = vi.fn();
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();
  
  // Mocked success response from the form submission
  const mockMutationResponse = {
    id: '123',
    materials: ['plastic', 'glass'],
    weight_estimate: 10,
    scheduled_date: '2025-10-01',
    address: '123 Main St',
    time_slot: '10:00-12:00',
    is_recurring: false,
    recurrence_type: 'none',
    status: 'scheduled'
  };
  
  // Mock available time slots
  const mockTimeSlots = {
    slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00']
  };

  beforeEach(() => {
    // Set up navigation mock
    useNavigate.mockReturnValue(mockNavigate);
    
    // Set up mutation mock
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null
    });
    
    // Set up query mock for time slots
    useQuery.mockReturnValue({
      data: mockTimeSlots,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
    
    // Set up the queryClient mock
    vi.spyOn(require('@tanstack/react-query'), 'useQueryClient').mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the pickup request form', () => {
    render(<PickupRequestForm />);
    
    // Check that form elements are rendered
    expect(screen.getByText(/request pickup/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/materials/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight estimate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it('validates form fields on submission', async () => {
    render(<PickupRequestForm />);
    
    // Try to submit an empty form
    fireEvent.click(screen.getByRole('button', { name: /submit|schedule pickup/i }));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/select at least one material/i)).toBeInTheDocument();
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/select a date/i)).toBeInTheDocument();
      expect(screen.getByText(/select a time slot/i)).toBeInTheDocument();
    });
    
    // Verify the mutation was not called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    render(<PickupRequestForm />);
    
    // Fill out the form
    // Select materials (assuming there are checkboxes with these labels)
    await userEvent.click(screen.getByLabelText(/plastic/i));
    await userEvent.click(screen.getByLabelText(/glass/i));
    
    // Enter weight estimate
    await userEvent.clear(screen.getByLabelText(/weight estimate/i));
    await userEvent.type(screen.getByLabelText(/weight estimate/i), '10');
    
    // Enter address
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    
    // Select date (assuming there's a datepicker that opens on click)
    fireEvent.click(screen.getByLabelText(/select date/i));
    // Select a date from the calendar
    // This will depend on your date picker implementation
    fireEvent.click(screen.getByText('15')); // Example: click on day 15
    
    // Select time slot
    fireEvent.change(screen.getByLabelText(/time slot/i), {
      target: { value: '10:00-12:00' }
    });
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit|schedule pickup/i }));
    
    // Verify form data was passed to the mutation
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          materials: ['plastic', 'glass'],
          weight_estimate: 10,
          address: '123 Main St',
          time_slot: '10:00-12:00',
        }),
        expect.any(Object)
      );
    });
  });

  it('shows success message and redirects on successful submission', async () => {
    // Set up mutation to be successful
    useMutation.mockReturnValue({
      mutate: (data, options) => {
        options.onSuccess(mockMutationResponse);
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null
    });
    
    render(<PickupRequestForm />);
    
    // Fill out required fields minimally
    await userEvent.click(screen.getByLabelText(/plastic/i));
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    
    // Select date
    fireEvent.click(screen.getByLabelText(/select date/i));
    fireEvent.click(screen.getByText('15')); 
    
    // Select time slot
    fireEvent.change(screen.getByLabelText(/time slot/i), {
      target: { value: '10:00-12:00' }
    });
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit|schedule pickup/i }));
    
    // Check for success behavior
    await waitFor(() => {
      // Verify toast success was called
      expect(require('react-toastify').toast.success).toHaveBeenCalled();
      
      // Verify navigation to pickup details page
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/pickup/123'),
        expect.any(Object)
      );
      
      // Verify cache invalidation
      expect(mockInvalidateQueries).toHaveBeenCalledWith(['pickup']);
    });
  });

  it('shows error message when submission fails', async () => {
    // Set up mutation to fail
    const errorMessage = 'Server error, please try again later';
    useMutation.mockReturnValue({
      mutate: (data, options) => {
        options.onError(new Error(errorMessage));
      },
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error(errorMessage)
    });
    
    render(<PickupRequestForm />);
    
    // Fill out required fields minimally
    await userEvent.click(screen.getByLabelText(/plastic/i));
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    
    // Select date
    fireEvent.click(screen.getByLabelText(/select date/i));
    fireEvent.click(screen.getByText('15')); 
    
    // Select time slot
    fireEvent.change(screen.getByLabelText(/time slot/i), {
      target: { value: '10:00-12:00' }
    });
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit|schedule pickup/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(require('react-toastify').toast.error).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage)
      );
    });
  });

  it('disables submit button while loading', async () => {
    // Set up mutation to be loading
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null
    });
    
    render(<PickupRequestForm />);
    
    // Check that the submit button is disabled
    const submitButton = screen.getByRole('button', { name: /submit|schedule pickup/i });
    expect(submitButton).toBeDisabled();
  });

  it('handles recurring pickup selection', async () => {
    render(<PickupRequestForm />);
    
    // Toggle recurring pickup
    await userEvent.click(screen.getByLabelText(/recurring pickup/i));
    
    // Recurrence options should appear
    expect(screen.getByLabelText(/recurrence type/i)).toBeInTheDocument();
    
    // Select weekly recurrence
    fireEvent.change(screen.getByLabelText(/recurrence type/i), {
      target: { value: 'weekly' }
    });
    
    // End date field should appear
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    
    // Fill out required fields minimally
    await userEvent.click(screen.getByLabelText(/plastic/i));
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    
    // Select date
    fireEvent.click(screen.getByLabelText(/select date/i));
    fireEvent.click(screen.getByText('15')); 
    
    // Select time slot
    fireEvent.change(screen.getByLabelText(/time slot/i), {
      target: { value: '10:00-12:00' }
    });
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit|schedule pickup/i }));
    
    // Verify form data includes recurrence information
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_recurring: true,
          recurrence_type: 'weekly'
        }),
        expect.any(Object)
      );
    });
  });
});