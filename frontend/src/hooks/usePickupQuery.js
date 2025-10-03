import { useMutation, useQuery } from '@tanstack/react-query';
import pickupService from '../services/pickup.service';
import { queryKeys, queryClient } from '../services/queryClient';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook for fetching pickup requests with filters
 * 
 * @param {Object} filters - Filter parameters like status, date range, page
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const usePickupRequests = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.pickups.list(filters),
    queryFn: () => pickupService.getPickupRequests(filters),
    keepPreviousData: true, // Keep old data while fetching new data
    ...options
  });
};

/**
 * Hook for fetching a single pickup request
 * 
 * @param {string|number} id - Pickup request ID
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const usePickupRequest = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.pickups.detail(id),
    queryFn: () => pickupService.getPickupRequest(id),
    enabled: !!id, // Only run if ID is provided
    ...options
  });
};

/**
 * Hook for creating a new pickup request with optimistic updates
 * 
 * @returns {Object} Mutation result
 */
export const useCreatePickupRequest = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: pickupService.createPickupRequest,
    
    // Optimistically update the UI before the server responds
    onMutate: async (newRequest) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries(queryKeys.pickups.all);
      
      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData(queryKeys.pickups.list());
      
      // Optimistically update to the new value
      if (previousRequests) {
        const optimisticRequest = {
          ...newRequest,
          id: `temp-${Date.now()}`, // Temporary ID
          status: 'pending',
          createdAt: new Date().toISOString(),
          isOptimistic: true // Flag to identify this is an optimistic entry
        };
        
        queryClient.setQueryData(queryKeys.pickups.list(), old => ({
          ...old,
          data: [optimisticRequest, ...(old?.data || [])]
        }));
      }
      
      return { previousRequests };
    },
    
    // If the mutation succeeds, update with the actual server data
    onSuccess: (result, variables, context) => {
      addToast({
        type: 'success',
        title: 'Pickup Request Created',
        message: 'Your pickup request has been submitted successfully.'
      });
      
      // Replace optimistic entry with actual data from server
      queryClient.invalidateQueries(queryKeys.pickups.all);
    },
    
    // If the mutation fails, roll back to the previous state
    onError: (error, variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKeys.pickups.list(), context.previousRequests);
      }
      
      addToast({
        type: 'error',
        title: 'Failed to Create Pickup Request',
        message: error.message || 'An error occurred while creating your pickup request.'
      });
    }
  });
};

/**
 * Hook for updating a pickup request
 * 
 * @returns {Object} Mutation result
 */
export const useUpdatePickupRequest = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }) => pickupService.updatePickupRequest(id, data),
    
    onSuccess: (result, { id }) => {
      addToast({
        type: 'success',
        title: 'Pickup Request Updated',
        message: 'Your pickup request has been updated successfully.'
      });
      
      // Update the detailed view
      queryClient.invalidateQueries(queryKeys.pickups.detail(id));
      
      // Update the list view
      queryClient.invalidateQueries(queryKeys.pickups.list());
    }
  });
};

/**
 * Hook for canceling a pickup request
 * 
 * @returns {Object} Mutation result
 */
export const useCancelPickupRequest = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: (id) => pickupService.cancelPickupRequest(id),
    
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(queryKeys.pickups.detail(id));
      
      // Snapshot the previous value
      const previousRequest = queryClient.getQueryData(queryKeys.pickups.detail(id));
      
      // Optimistically update to the new value
      if (previousRequest) {
        queryClient.setQueryData(queryKeys.pickups.detail(id), {
          ...previousRequest,
          status: 'cancelled'
        });
      }
      
      return { previousRequest };
    },
    
    onSuccess: (result, id) => {
      addToast({
        type: 'info',
        title: 'Pickup Request Cancelled',
        message: 'Your pickup request has been cancelled.'
      });
      
      // Update the list view
      queryClient.invalidateQueries(queryKeys.pickups.list());
    },
    
    onError: (error, id, context) => {
      // Roll back to the previous state if mutation fails
      if (context?.previousRequest) {
        queryClient.setQueryData(
          queryKeys.pickups.detail(id), 
          context.previousRequest
        );
      }
      
      addToast({
        type: 'error',
        title: 'Failed to Cancel Pickup Request',
        message: error.message || 'An error occurred while canceling your pickup request.'
      });
    }
  });
};