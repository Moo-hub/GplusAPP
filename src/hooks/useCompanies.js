import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CompanyService from '../services/company';
import { useToast } from '../components/toast/Toast';

// Query keys for companies
export const companyKeys = {
  all: ['companies'],
  lists: () => [...companyKeys.all, 'list'],
  list: (filters) => [...companyKeys.lists(), { filters }],
  details: () => [...companyKeys.all, 'detail'],
  detail: (id) => [...companyKeys.details(), id],
};

export const useCompanies = (filters = {}) => {
  const { showError } = useToast();

  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => CompanyService.getCompanies(filters),
    onError: (error) => {
      showError('Failed to fetch companies');
      console.error('Error fetching companies:', error);
    },
  });
};

export const useCompany = (id) => {
  const { showError } = useToast();

  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => CompanyService.getCompany(id),
    enabled: !!id, // Only run the query if id is provided
    onError: (error) => {
      showError(`Failed to fetch company details`);
      console.error(`Error fetching company ${id}:`, error);
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (data) => CompanyService.createCompany(data),
    onSuccess: () => {
      // Invalidate and refetch the companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      showSuccess('Company created successfully');
    },
    onError: (error) => {
      showError('Failed to create company');
      console.error('Error creating company:', error);
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => CompanyService.updateCompany(id, data),
    onSuccess: (data, variables) => {
      // Update the company in the cache
      queryClient.invalidateQueries({ 
        queryKey: companyKeys.detail(variables.id) 
      });
      
      // Also update any list that might include this company
      queryClient.invalidateQueries({
        queryKey: companyKeys.lists(),
      });
      
      showSuccess('Company updated successfully');
    },
    onError: (error) => {
      showError('Failed to update company');
      console.error('Error updating company:', error);
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (id) => CompanyService.deleteCompany(id),
    onSuccess: (data, id) => {
      // Remove the company from the cache
      queryClient.removeQueries({ queryKey: companyKeys.detail(id) });
      
      // Also update the list
      queryClient.invalidateQueries({ 
        queryKey: companyKeys.lists(),
      });
      
      showSuccess('Company deleted successfully');
    },
    onError: (error) => {
      showError('Failed to delete company');
      console.error('Error deleting company:', error);
    },
  });
};