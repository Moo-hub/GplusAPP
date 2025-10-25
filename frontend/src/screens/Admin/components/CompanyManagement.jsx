import { useState, useEffect } from 'react';
import useSafeTranslation from '../../../hooks/useSafeTranslation';
import api from '../../../services/api';
import './CompanyManagement.css';

const CompanyManagement = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    status: 'active',
    industry: ''
  });
  const [filter, setFilter] = useState({
    search: '',
    status: 'all',
    industry: 'all'
  });

  // Industries for dropdown
  const industries = [
    'manufacturing',
    'retail',
    'technology',
    'food_service',
    'healthcare',
    'education',
    'hospitality'
  ];

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Filter companies based on search and filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(filter.search.toLowerCase()) || 
                        (company.email && company.email.toLowerCase().includes(filter.search.toLowerCase()));
    const matchesStatus = filter.status === 'all' || company.status === filter.status;
    const matchesIndustry = filter.industry === 'all' || company.industry === filter.industry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Handle edit company
  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      email: company.email || '',
      address: company.address || '',
      phone: company.phone || '',
      status: company.status || 'active',
      industry: company.industry || ''
    });
  };

  // Handle delete company
  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm(t('admin.confirmDeleteCompany'))) {
      return;
    }

    try {
      await api.delete(`/admin/companies/${companyId}`);
      setCompanies(companies.filter(company => company.id !== companyId));
    } catch (err) {
      setError(err.message || 'Failed to delete company');
    }
  };

  // Save company (create or update)
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // Update existing company
        const response = await api.put(`/admin/companies/${editingCompany.id}`, formData);
        setCompanies(companies.map(company => company.id === editingCompany.id ? response.data : company));
      } else {
        // Create new company
        const response = await api.post('/admin/companies', formData);
        setCompanies([...companies, response.data]);
      }
      
      // Reset form
      setEditingCompany(null);
      setFormData({
        name: '',
        email: '',
        address: '',
        phone: '',
        status: 'active',
        industry: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to save company');
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
      status: 'active',
      industry: ''
    });
  };

  return (
    <div className="company-management">
      <div className="company-management-header">
        <h2>{t('admin.companyManagement')}</h2>
        <div className="filter-controls">
          <input
            type="text"
            placeholder={t('admin.searchCompanies')}
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
            className="search-input"
          />
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="status-filter"
          >
            <option value="all">{t('admin.allStatuses')}</option>
            <option value="active">{t('admin.active')}</option>
            <option value="pending">{t('admin.pending')}</option>
            <option value="suspended">{t('admin.suspended')}</option>
          </select>
          <select 
            value={filter.industry} 
            onChange={(e) => setFilter({...filter, industry: e.target.value})}
            className="industry-filter"
          >
            <option value="all">{t('admin.allIndustries')}</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {t(`admin.industry.${industry}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="company-management-content">
        <div className="company-list-container">
          {loading ? (
            <div className="loading">{t('common.loading')}</div>
          ) : (
            <>
              <table className="company-table">
                <thead>
                  <tr>
                    <th>{t('admin.companyName')}</th>
                    <th>{t('admin.contact')}</th>
                    <th>{t('admin.industry')}</th>
                    <th>{t('admin.status')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map(company => (
                      <tr key={company.id}>
                        <td>
                          <div className="company-name">{company.name}</div>
                          <div className="company-address">{company.address}</div>
                        </td>
                        <td>
                          <div className="company-email">{company.email}</div>
                          <div className="company-phone">{company.phone}</div>
                        </td>
                        <td>
                          {company.industry ? (
                            <span className="industry-badge">
                              {t(`admin.industry.${company.industry}`)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`status-badge status-${company.status || 'active'}`}>
                            {t(`admin.${company.status || 'active'}`)}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="action-button edit"
                            onClick={() => handleEditCompany(company)}
                          >
                            {t('admin.edit')}
                          </button>
                          <button 
                            className="action-button delete"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            {t('admin.delete')}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-results">
                        {t('admin.noCompaniesFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
        
        <div className="company-form-container">
          <h3>{editingCompany ? t('admin.editCompany') : t('admin.createCompany')}</h3>
          <form onSubmit={handleSaveCompany}>
            <div className="form-group">
              <label htmlFor="name">{t('admin.companyName')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder={t('admin.enterCompanyName')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">{t('admin.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder={t('admin.enterEmail')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">{t('admin.phone')}</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('admin.enterPhone')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">{t('admin.address')}</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t('admin.enterAddress')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="industry">{t('admin.industry')}</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('admin.selectIndustry')}</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {t(`admin.industry.${industry}`)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">{t('admin.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">{t('admin.active')}</option>
                <option value="pending">{t('admin.pending')}</option>
                <option value="suspended">{t('admin.suspended')}</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleCancel}
              >
                {t('admin.cancel')}
              </button>
              <button type="submit" className="save-button">
                {editingCompany ? t('admin.saveChanges') : t('admin.createCompany')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;