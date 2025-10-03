import { useMutation, useQuery } from '@tanstack/react-query';
import pointsService from '../services/points.service';
import { queryKeys, queryClient } from '../services/queryClient';

/**
 * Hook for fetching user points summary
 * 
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const usePointsSummary = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.points.summary,
    queryFn: pointsService.getPointsSummary,
    ...options
  });
};

/**
 * Hook for fetching points transaction history
 * 
 * @param {Object} filters - Filter parameters like page, limit, dateRange
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const usePointsHistory = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.points.transactions(filters),
    queryFn: () => pointsService.getTransactionHistory(filters),
    keepPreviousData: true,
    ...options
  });
};

/**
 * Hook for redeeming points
 * 
 * @returns {Object} Mutation result
 */
export const useRedeemPoints = () => {
  return useMutation({
    mutationFn: pointsService.redeemPoints,
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries(queryKeys.points.summary);
      queryClient.invalidateQueries(queryKeys.points.transactions);
      
      // Optionally update the cache directly for instant UI updates
      queryClient.setQueryData(queryKeys.points.summary, (oldData) => {
        if (!oldData) return null;
        
        return {
          ...oldData,
          available: oldData.available - data.pointsRedeemed
        };
      });
    }
  });
};

/**
 * Hook for adding points manually (admin only)
 * 
 * @returns {Object} Mutation result
 */
export const useAddPoints = () => {
  return useMutation({
    mutationFn: pointsService.addPoints,
    onSuccess: () => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries(queryKeys.points.summary);
      queryClient.invalidateQueries(queryKeys.points.transactions);
    }
  });
};

/**
 * Hook for transferring points to another user
 * 
 * @returns {Object} Mutation result
 */
export const useTransferPoints = () => {
  return useMutation({
    mutationFn: pointsService.transferPoints,
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries(queryKeys.points.summary);
      queryClient.invalidateQueries(queryKeys.points.transactions);
      
      // Optionally update the cache directly for instant UI updates
      queryClient.setQueryData(queryKeys.points.summary, (oldData) => {
        if (!oldData) return null;
        
        return {
          ...oldData,
          available: oldData.available - data.pointsTransferred
        };
      });
    }
  });
};

/**
 * Hook for fetching points redemption options
 * 
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useRedemptionOptions = (options = {}) => {
  return useQuery({
    queryKey: ['points', 'redemption-options'],
    queryFn: pointsService.getRedemptionOptions,
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options
  });
};