import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import './PickupManagement.css';

const PickupManagement = () => {
  const { t } = useTranslation();
  const [pickups, setPickups] = useState([]);
  const [filteredPickups, setFilteredPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPickups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pickups, statusFilter, dateFilter, searchQuery]);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pickups');
      setPickups(response.data);
      setFilteredPickups(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch pickups');
      setLoading(false);
      toast.error(t('admin.pickups.fetchError'));
    }
  };

  const applyFilters = () => {
    let filtered = [...pickups];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === statusFilter);
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(pickup => new Date(pickup.scheduled_date) >= today);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(pickup => new Date(pickup.scheduled_date) < today);
    } else if (dateFilter === 'today') {
      filtered = filtered.filter(pickup => {
        const pickupDate = new Date(pickup.scheduled_date);
        return pickupDate.getDate() === today.getDate() &&
               pickupDate.getMonth() === today.getMonth() &&
               pickupDate.getFullYear() === today.getFullYear();
      });
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pickup =>
        pickup.company_name.toLowerCase().includes(query) ||
        pickup.address.toLowerCase().includes(query) ||
        pickup.contact_name.toLowerCase().includes(query)
      );
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
    
    setFilteredPickups(filtered);
  };

  const handleStatusChange = async (pickupId, newStatus) => {
    try {
      await api.patch(`/admin/pickups/${pickupId}`, { status: newStatus });
      
      // Update local state
      const updatedPickups = pickups.map(pickup => 
        pickup.id === pickupId ? { ...pickup, status: newStatus } : pickup
      );
      
      setPickups(updatedPickups);
      toast.success(t('admin.pickups.statusUpdated'));
    } catch (_err) {
      toast.error(t('admin.pickups.updateError'));
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const viewPickupDetails = (pickup) => {
    setSelectedPickup(pickup);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedPickup(null);
  };

  const getRecurrenceText = (pickup) => {
    if (!pickup.is_recurring) return t('admin.pickups.oneTime');
    
    let recurrenceText = '';
    
    switch (pickup.recurrence_pattern) {
      case 'daily':
        recurrenceText = t('admin.pickups.daily');
        break;
      case 'weekly':
        recurrenceText = t('admin.pickups.weekly');
        break;
      case 'monthly':
        recurrenceText = t('admin.pickups.monthly');
        break;
      default:
        recurrenceText = t('admin.pickups.custom');
    }
    
    return recurrenceText;
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="pickup-management">
      <div className="pickup-management-header">
        <h2>{t('admin.pickups.title')}</h2>
        <div className="filter-controls">
          <input
            type="text"
            className="search-input"
            placeholder={t('admin.pickups.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('admin.pickups.allStatuses')}</option>
            <option value="scheduled">{t('admin.pickups.scheduled')}</option>
            <option value="in_progress">{t('admin.pickups.inProgress')}</option>
            <option value="completed">{t('admin.pickups.completed')}</option>
            <option value="cancelled">{t('admin.pickups.cancelled')}</option>
          </select>
          <select
            className="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">{t('admin.pickups.allDates')}</option>
            <option value="upcoming">{t('admin.pickups.upcoming')}</option>
            <option value="past">{t('admin.pickups.past')}</option>
            <option value="today">{t('admin.pickups.today')}</option>
          </select>
          <button className="refresh-button" onClick={fetchPickups}>
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="pickup-list-container">
        {filteredPickups.length === 0 ? (
          <div className="no-results">{t('admin.pickups.noResults')}</div>
        ) : (
          <table className="pickup-table">
            <thead>
              <tr>
                <th>{t('admin.pickups.id')}</th>
                <th>{t('admin.pickups.company')}</th>
                <th>{t('admin.pickups.scheduledDate')}</th>
                <th>{t('admin.pickups.timeSlot')}</th>
                <th>{t('admin.pickups.recurrence')}</th>
                <th>{t('admin.pickups.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPickups.map((pickup) => (
                <tr key={pickup.id}>
                  <td>{pickup.id}</td>
                  <td className="company-cell">
                    <span className="company-name">{pickup.company_name}</span><br />
                    <span className="company-address">{pickup.address}</span>
                  </td>
                  <td>{format(new Date(pickup.scheduled_date), 'MMM dd, yyyy')}</td>
                  <td>{pickup.time_slot}</td>
                  <td>{getRecurrenceText(pickup)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(pickup.status)}`}>
                      {t(`admin.pickups.${pickup.status}`)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-button view" onClick={() => viewPickupDetails(pickup)}>
                      {t('common.view')}
                    </button>
                    <select 
                      className="status-update-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleStatusChange(pickup.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">{t('admin.pickups.updateStatus')}</option>
                      <option value="scheduled">{t('admin.pickups.scheduled')}</option>
                      <option value="in_progress">{t('admin.pickups.inProgress')}</option>
                      <option value="completed">{t('admin.pickups.completed')}</option>
                      <option value="cancelled">{t('admin.pickups.cancelled')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDetails && selectedPickup && (
        <div className="pickup-details-modal">
          <div className="pickup-details-content">
            <button className="close-button" onClick={closeDetails}>&times;</button>
            <h3>{t('admin.pickups.detailsTitle')}</h3>
            
            <div className="detail-section">
              <h4>{t('admin.pickups.companyDetails')}</h4>
              <p><strong>{t('admin.pickups.company')}:</strong> {selectedPickup.company_name}</p>
              <p><strong>{t('admin.pickups.address')}:</strong> {selectedPickup.address}</p>
              <p><strong>{t('admin.pickups.contactName')}:</strong> {selectedPickup.contact_name}</p>
              <p><strong>{t('admin.pickups.contactPhone')}:</strong> {selectedPickup.contact_phone}</p>
            </div>
            
            <div className="detail-section">
              <h4>{t('admin.pickups.scheduleDetails')}</h4>
              <p>
                <strong>{t('admin.pickups.scheduledDate')}:</strong> {format(new Date(selectedPickup.scheduled_date), 'MMM dd, yyyy')}
              </p>
              <p><strong>{t('admin.pickups.timeSlot')}:</strong> {selectedPickup.time_slot}</p>
              <p>
                <strong>{t('admin.pickups.recurrencePattern')}:</strong> {getRecurrenceText(selectedPickup)}
                {selectedPickup.is_recurring && selectedPickup.recurrence_end_date && (
                  <span> ({t('admin.pickups.until')} {format(new Date(selectedPickup.recurrence_end_date), 'MMM dd, yyyy')})</span>
                )}
              </p>
            </div>

            <div className="detail-section">
              <h4>{t('admin.pickups.materialDetails')}</h4>
              <ul className="material-list">
                {selectedPickup.materials.map((material, index) => (
                  <li key={index}>
                    <strong>{material.type}:</strong> {material.quantity} {material.unit}
                    {material.notes && <span className="material-notes"> - {material.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h4>{t('admin.pickups.additionalInfo')}</h4>
              <p><strong>{t('admin.pickups.specialInstructions')}:</strong> {selectedPickup.special_instructions || t('admin.pickups.none')}</p>
              <p><strong>{t('admin.pickups.createdAt')}:</strong> {format(new Date(selectedPickup.created_at), 'MMM dd, yyyy HH:mm')}</p>
              {selectedPickup.last_updated && (
                <p><strong>{t('admin.pickups.lastUpdated')}:</strong> {format(new Date(selectedPickup.last_updated), 'MMM dd, yyyy HH:mm')}</p>
              )}
            </div>

            <div className="detail-section status-section">
              <h4>{t('admin.pickups.statusUpdate')}</h4>
              <div className="status-update-form">
                <select 
                  className="status-select"
                  value={selectedPickup.status}
                  onChange={(e) => handleStatusChange(selectedPickup.id, e.target.value)}
                >
                  <option value="scheduled">{t('admin.pickups.scheduled')}</option>
                  <option value="in_progress">{t('admin.pickups.inProgress')}</option>
                  <option value="completed">{t('admin.pickups.completed')}</option>
                  <option value="cancelled">{t('admin.pickups.cancelled')}</option>
                </select>
                <p className="current-status">
                  {t('admin.pickups.currentStatus')}: 
                  <span className={`status-badge ${getStatusClass(selectedPickup.status)}`}>
                    {t(`admin.pickups.${selectedPickup.status}`)}
                  </span>
                </p>
              </div>
            </div>

            <div className="detail-actions">
              <button className="secondary-button" onClick={closeDetails}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupManagement;