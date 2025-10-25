/**
 * API Performance Dashboard service module
 * This module provides functions to fetch Redis and API performance metrics
 */
import apiClient from '../services/apiClient.js';
import { handleApiError } from './apiUtils.js';

const API_URL = '/api/v1';

/**
 * Fetch Redis memory metrics
 * @returns {Promise<Object>} Redis memory usage metrics
 */
export const getRedisMemoryMetrics = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/metrics/redis/memory`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch Redis memory metrics');
  }
};

/**
 * Fetch Redis key pattern usage
 * @returns {Promise<Object>} Redis key pattern memory usage
 */
export const getRedisKeyPatterns = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/metrics/redis/keys`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch Redis key pattern usage');
  }
};

/**
 * Fetch API performance metrics
 * @returns {Promise<Object>} API performance metrics
 */
export const getApiPerformanceMetrics = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/metrics/api/performance`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch API performance metrics');
  }
};

/**
 * Fetch system health metrics
 * @returns {Promise<Object>} System health metrics
 */
export const getSystemHealthMetrics = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/metrics/system/health`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch system health metrics');
  }
};