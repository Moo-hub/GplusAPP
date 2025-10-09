import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PickupService from '../services/pickup';
import { useToast } from '../components/toast/Toast';

// Query keys for pickups
export const pickupKeys = {
  all: ['pickups'],
  lists: () => [...pickupKeys.all, 'list'],
  list: (filters) => [...pickupKeys.lists(), { filters }],
  details: () => [...pickupKeys.all, 'detail'],
  detail: (id) => [...pickupKeys.details(), id],
  userPickups: (userId) => [...pickupKeys.all, 'user', userId],
};

export const usePickups = (filters = {}) => {
  const { showError } = useToast();

  return useQuery({
    queryKey: pickupKeys.list(filters),
    queryFn: () => PickupService.getPickups(filters),
    onError: (error) => {
      showError('Failed to fetch pickup requests');
      console.error('Error fetching pickups:', error);
    },
  });
};

export const usePickup = (id) => {
  const { showError } = useToast();

  return useQuery({
    queryKey: pickupKeys.detail(id),
    queryFn: () => PickupService.getPickup(id),
    enabled: !!id, // Only run the query if id is provided
    onError: (error) => {
      showError(`Failed to fetch pickup request details`);
      console.error(`Error fetching pickup ${id}:`, error);
    },
  });
};

export const useUserPickups = (userId) => {
  const { showError } = useToast();

  return useQuery({
    queryKey: pickupKeys.userPickups(userId),
    queryFn: () => PickupService.getUserPickups(userId),
    enabled: !!userId, // Only run the query if userId is provided
    onError: (error) => {
      showError(`Failed to fetch user's pickup requests`);
      console.error(`Error fetching pickups for user ${userId}:`, error);
    },
  });
};

export const useCreatePickup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data) => PickupService.createPickup(data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch the pickups list
      queryClient.invalidateQueries({ queryKey: pickupKeys.lists() });
      
      // If the pickup is for the current user, also update user-specific queries
      if (variables.user_id) {
        queryClient.invalidateQueries({ 
          queryKey: pickupKeys.userPickups(variables.user_id) 
        });
      }
      
      showSuccess('Pickup request created successfully');
    },
    onError: (error) => {
      showError('Failed to create pickup request');
      console.error('Error creating pickup:', error);
    },
  });
};

export const useUpdatePickup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => PickupService.updatePickup(id, data),
    onSuccess: (data, variables) => {
      // Update the pickup in the cache
      queryClient.invalidateQueries({ 
        queryKey: pickupKeys.detail(variables.id) 
      });
      
      // Also update any lists that might include this pickup
      queryClient.invalidateQueries({
        queryKey: pickupKeys.lists(),
      });
      
      showSuccess('Pickup request updated successfully');
    },
    onError: (error) => {
      showError('Failed to update pickup request');
      console.error('Error updating pickup:', error);
    },
  });
};

export const useCancelPickup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (id) => PickupService.cancelPickup(id),
    onSuccess: (data, id) => {
      // Update the pickup detail
      queryClient.invalidateQueries({ 
        queryKey: pickupKeys.detail(id) 
      });
      
      // Also update lists
      queryClient.invalidateQueries({
        queryKey: pickupKeys.lists(),
      });
      
      showSuccess('Pickup request cancelled successfully');
    },
    onError: (error) => {
      showError('Failed to cancel pickup request');
      console.error('Error cancelling pickup:', error);
    },
  });
};