import { useMutation, useQuery } from '@tanstack/react-query';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import { queryKeys, queryClient } from '../services/queryClient';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook for fetching the current user's profile
 * 
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useUserProfile = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.data,
    queryFn: authService.getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
};

/**
 * Hook for updating the user's profile
 * 
 * @returns {Object} Mutation result
 */
export const useUpdateProfile = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: (profileData) => userService.updateProfile(profileData),
    
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(queryKeys.profile.data);
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(queryKeys.profile.data);
      
      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData(queryKeys.profile.data, {
          ...previousProfile,
          ...newProfile
        });
      }
      
      return { previousProfile };
    },
    
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.'
      });
    },
    
    onError: (error, newProfile, context) => {
      // Roll back to the previous state if mutation fails
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.profile.data,
          context.previousProfile
        );
      }
      
      addToast({
        type: 'error',
        title: 'Profile Update Failed',
        message: error.message || 'There was an error updating your profile.'
      });
    },
    
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries(queryKeys.profile.data);
    }
  });
};

/**
 * Hook for changing the user's password
 * 
 * @returns {Object} Mutation result
 */
export const useChangePassword = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => 
      userService.changePassword(currentPassword, newPassword),
    
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.'
      });
    }
  });
};

/**
 * Hook for updating user notification settings
 * 
 * @returns {Object} Mutation result
 */
export const useUpdateNotificationSettings = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: (settings) => userService.updateNotificationSettings(settings),
    
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(queryKeys.profile.settings);
      
      // Snapshot the previous settings
      const previousSettings = queryClient.getQueryData(queryKeys.profile.settings);
      
      // Optimistically update to the new settings
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.profile.settings, {
          ...previousSettings,
          ...newSettings
        });
      }
      
      return { previousSettings };
    },
    
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your notification settings have been updated.'
      });
    },
    
    onError: (error, newSettings, context) => {
      // Roll back to the previous settings if mutation fails
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.profile.settings,
          context.previousSettings
        );
      }
    },
    
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(queryKeys.profile.settings);
    }
  });
};

/**
 * Hook for uploading a profile picture
 * 
 * @returns {Object} Mutation result
 */
export const useUploadProfilePicture = () => {
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: (file) => userService.uploadProfilePicture(file),
    
    onSuccess: (result) => {
      // Update the profile with new image URL
      queryClient.setQueryData(queryKeys.profile.data, (oldData) => {
        if (!oldData) return null;
        
        return {
          ...oldData,
          profilePicture: result.imageUrl
        };
      });
      
      addToast({
        type: 'success',
        title: 'Profile Picture Updated',
        message: 'Your profile picture has been updated successfully.'
      });
    }
  });
};