import { useState } from 'react';

function ApiTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    setResult('Testing API call...');
    
    try {
      // Use centralized apiClient so tests and MSW interceptors are used
      const { default: apiClient } = await import('../services/apiClient.js');
      const resp = await apiClient.get('/system/health');
      const data = resp && resp.data ? resp.data : resp;
      setResult(`Success! Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error && error.message ? error.message : String(error)}`);
  try { require('../utils/logger').error('API Test Error:', error); } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const testLoginCall = async () => {
    setLoading(true);
    setResult('Testing login API call...');
    
    try {
      const formData = new FormData();
      formData.append('username', 'user@example.com');
      formData.append('password', 'password');
      const { default: apiClient } = await import('../services/apiClient.js');
      const resp = await apiClient.post('/auth/login', formData);
      const data = resp && resp.data ? resp.data : resp;
      setResult(`Login Success! Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Login Error: ${error && error.message ? error.message : String(error)}`);
  try { require('../utils/logger').error('Login Test Error:', error); } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔧 API Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testApiCall} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Health API'}
        </button>
        
        <button 
          onClick={testLoginCall} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Login API'}
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
      }}>
        {result || 'Click a button to test API connectivity'}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Frontend:</strong> http://localhost:3007</p>
        <p><strong>Backend:</strong> http://localhost:8000</p>
        <p><strong>Proxy:</strong> /api → http://localhost:8000/api/v1 (Vite Development Proxy)</p>
        <p><strong>Note:</strong> Using Vite proxy for development - no CORS issues!</p>
      </div>
    </div>
  );
}

export default ApiTest;