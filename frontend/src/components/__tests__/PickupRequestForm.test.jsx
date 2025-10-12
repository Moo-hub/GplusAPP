import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupRequestForm from '../PickupRequestForm';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn()
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('PickupRequestForm Component', () => {
  // Setup mocks
  const mockNavigate = vi.fn();
  const mockMutate = vi.fn();
  const mockT = (key) => key; // Simple translation mock

  beforeEach(() => {
    vi.resetAllMocks();
    
    useNavigate.mockReturnValue(mockNavigate);
    
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false
    });
    
    useTranslation.mockReturnValue({ t: mockT });
  });

  it('renders the form with all fields', () => {
    render(<PickupRequestForm />);

    // Check for form title
    expect(screen.getByText('pickup.newRequest')).toBeInTheDocument();
    
    // Check for material options
    expect(screen.getByText('pickup.selectMaterials')).toBeInTheDocument();
    expect(screen.getByText('materials.plastic')).toBeInTheDocument();
    expect(screen.getByText('materials.paper')).toBeInTheDocument();
    expect(screen.getByText('materials.glass')).toBeInTheDocument();
    expect(screen.getByText('materials.metal')).toBeInTheDocument();
    expect(screen.getByText('materials.electronics')).toBeInTheDocument();
    
    // Check for other form fields
    expect(screen.getByLabelText(/pickup.weightEstimate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup.pickupDate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/pickup.address/)).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
    expect(screen.getByText('pickup.submit')).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted without required fields', async () => {
    render(<PickupRequestForm />);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByText('pickup.submit');
    fireEvent.click(submitButton);
    
    // Check for validation errors
    expect(screen.getByText('validation.materialsRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.dateRequired')).toBeInTheDocument();
    expect(screen.getByText('validation.addressRequired')).toBeInTheDocument();
    
    // Mutation should not be called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(<PickupRequestForm />);
    
    // Fill form fields
    // Select material
    const plasticCheckbox = screen.getByLabelText('materials.plastic');
    await user.click(plasticCheckbox);
    
    // Enter weight
    const weightInput = screen.getByLabelText(/pickup.weightEstimate/);
    await user.clear(weightInput);
    await user.type(weightInput, '5');
    
    // Set date (need to use fireEvent for date inputs)
    const dateInput = screen.getByLabelText(/pickup.pickupDate/);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    const dateString = futureDate.toISOString().slice(0, 16); // Format for datetime-local
    fireEvent.change(dateInput, { target: { value: dateString } });
    
    // Enter address
    const addressInput = screen.getByLabelText(/pickup.address/);
    await user.type(addressInput, '123 Test Street, City');
    
    // Submit the form
    const submitButton = screen.getByText('pickup.submit');
    await user.click(submitButton);
    
    // Verify form submission
    expect(mockMutate).toHaveBeenCalledWith({
      materials: ['plastic'],
      weight_estimate: '5',
      scheduled_date: dateString,
      address: '123 Test Street, City'
    });
  });

  it('handles successful form submission', async () => {
    // Setup mutation to simulate success
    useMutation.mockImplementation(({ onSuccess }) => {
      return {
        mutate: (data) => {
          onSuccess();
        },
        isLoading: false
      };
    });
    
    render(<PickupRequestForm />);
    
    // Fill and submit form with minimal valid data
    const plasticCheckbox = screen.getByLabelText('materials.plastic');
    fireEvent.click(plasticCheckbox);
    
    const dateInput = screen.getByLabelText(/pickup.pickupDate/);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { 
      target: { value: futureDate.toISOString().slice(0, 16) } 
    });
    
    const addressInput = screen.getByLabelText(/pickup.address/);
    fireEvent.change(addressInput, { target: { value: 'Test Address' } });
    
    const submitButton = screen.getByText('pickup.submit');
    fireEvent.click(submitButton);
    
    // Verify success handling
    expect(toast.success).toHaveBeenCalledWith('pickup.requestSuccess');
    expect(mockNavigate).toHaveBeenCalledWith('/pickups');
  });

  it('handles form submission error', async () => {
    // Setup mutation to simulate error
    const errorMessage = 'API Error Message';
    useMutation.mockImplementation(({ onError }) => {
      return {
        mutate: (data) => {
          onError({ response: { data: { detail: errorMessage } } });
        },
        isLoading: false
      };
    });
    
    render(<PickupRequestForm />);
    
    // Fill and submit form with minimal valid data
    const plasticCheckbox = screen.getByLabelText('materials.plastic');
    fireEvent.click(plasticCheckbox);
    
    const dateInput = screen.getByLabelText(/pickup.pickupDate/);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { 
      target: { value: futureDate.toISOString().slice(0, 16) } 
    });
    
    const addressInput = screen.getByLabelText(/pickup.address/);
    fireEvent.change(addressInput, { target: { value: 'Test Address' } });
    
    const submitButton = screen.getByText('pickup.submit');
    fireEvent.click(submitButton);
    
    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  it('navigates back when cancel button is clicked', async () => {
    render(<PickupRequestForm />);
    
    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/pickups');
  });
});