import { useQuery } from '@tanstack/react-query';
import companyService from '../services/company.service';
import { queryKeys } from '../services/queryClient';

/**
 * Hook for fetching a list of companies with filtering
 * 
 * @param {Object} filters - Filter parameters like location, type, search
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useCompanies = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => companyService.getCompanies(filters),
    keepPreviousData: true, // Keep old data while fetching new data
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options
  });
};

/**
 * Hook for fetching a single company by ID
 * 
 * @param {string|number} id - Company ID
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useCompany = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companyService.getCompany(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 1000 * 60 * 30, // 30 minutes
    ...options
  });
};

/**
 * Hook for fetching company locations with optional filters
 * 
 * @param {Object} filters - Filter parameters like region, city
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useCompanyLocations = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['companies', 'locations', filters],
    queryFn: () => companyService.getCompanyLocations(filters),
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options
  });
};

/**
 * Hook for fetching company types for filtering
 * 
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useCompanyTypes = (options = {}) => {
  return useQuery({
    queryKey: ['companies', 'types'],
    queryFn: companyService.getCompanyTypes,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    ...options
  });
};

/**
 * Hook for fetching companies near a specific location
 * 
 * @param {Object} location - Location object with lat and lng
 * @param {number} radius - Search radius in km
 * @param {Object} options - Additional options for the query
 * @returns {Object} Query result
 */
export const useNearbyCompanies = (location, radius = 10, options = {}) => {
  return useQuery({
    queryKey: ['companies', 'nearby', { location, radius }],
    queryFn: () => companyService.getNearbyCompanies(location, radius),
    enabled: !!location?.lat && !!location?.lng, // Only run if location is provided
    ...options
  });
};