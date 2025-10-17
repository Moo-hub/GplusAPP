import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import './PickupCalendar.css';

const fetchPickupRequests = async () => {
  const response = await api.get('/pickup');
  return response.data;
};

const PickupCalendar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  const { data: pickups, isLoading } = useQuery({
    queryKey: ['pickup-requests'],
    queryFn: fetchPickupRequests
  });

  useEffect(() => {
    if (pickups) {
      const calendarEvents = [];

      pickups.forEach(pickup => {
        // Add the main event for the scheduled pickup
        const event = {
          id: `pickup-${pickup.id}`,
          title: formatEventTitle(pickup),
          start: pickup.scheduled_date,
          allDay: !pickup.time_slot, // If no time slot, consider it an all-day event
          classNames: [`pickup-status-${pickup.status}`],
          extendedProps: {
            pickupId: pickup.id,
            isRecurring: pickup.is_recurring,
            status: pickup.status,
            materials: pickup.materials,
            timeSlot: pickup.time_slot
          }
        };
        calendarEvents.push(event);

        // If recurring, add additional events based on recurrence type
        if (pickup.is_recurring && pickup.recurrence_type !== 'none') {
          const additionalEvents = generateRecurringEvents(pickup);
          calendarEvents.push(...additionalEvents);
        }
      });

      setEvents(calendarEvents);
    }
  }, [pickups]);

  const formatEventTitle = (pickup) => {
    if (pickup.time_slot) {
      return `${t('pickup.pickup')} - ${pickup.time_slot}`;
    }
    return t('pickup.pickup');
  };

  const generateRecurringEvents = (pickup) => {
    const recurringEvents = [];
    const startDate = new Date(pickup.scheduled_date);
    const endDate = pickup.recurrence_end_date 
      ? new Date(pickup.recurrence_end_date) 
      : new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from start if no end date

    let currentDate = new Date(startDate);
    let count = 0;
    const maxEvents = 50; // Limit to avoid performance issues

    while (currentDate <= endDate && count < maxEvents) {
      // Skip the first occurrence as it's already added as the main event
      if (count > 0) {
        let nextDate;
        
        if (pickup.recurrence_type === 'weekly') {
          nextDate = new Date(startDate);
          nextDate.setDate(startDate.getDate() + (7 * count));
        } else if (pickup.recurrence_type === 'bi_weekly') {
          nextDate = new Date(startDate);
          nextDate.setDate(startDate.getDate() + (14 * count));
        } else if (pickup.recurrence_type === 'monthly') {
          nextDate = new Date(startDate);
          nextDate.setMonth(startDate.getMonth() + count);
        }

        if (nextDate <= endDate) {
          recurringEvents.push({
            id: `pickup-${pickup.id}-recur-${count}`,
            title: `${formatEventTitle(pickup)} (${t('pickup.recurring')})`,
            start: nextDate.toISOString(),
            allDay: !pickup.time_slot,
            classNames: [`pickup-status-${pickup.status}`, 'pickup-recurring'],
            extendedProps: {
              pickupId: pickup.id,
              isRecurring: true,
              isRecurringInstance: true,
              status: pickup.status,
              materials: pickup.materials,
              timeSlot: pickup.time_slot
            }
          });
        }
      }
      
      count++;
      
      if (pickup.recurrence_type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pickup.recurrence_type === 'bi_weekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (pickup.recurrence_type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return recurringEvents;
  };

  const handleDateClick = (info) => {
    // Navigate to create new pickup with the selected date
    const date = new Date(info.dateStr);
    navigate('/pickups/new', { state: { selectedDate: date.toISOString() } });
  };

  const handleEventClick = (info) => {
    const pickupId = info.event.extendedProps.pickupId;
    navigate(`/pickups/${pickupId}`);
  };

  const renderEventContent = (eventInfo) => {
    const { timeSlot, materials, isRecurringInstance } = eventInfo.event.extendedProps;
    
    return (
      <div className="pickup-calendar-event">
        <div className="pickup-event-time">
          {timeSlot || t('pickup.allDay')}
          {isRecurringInstance && (
            <span className="pickup-event-recurring">
              <i className="fa fa-repeat"></i>
            </span>
          )}
        </div>
        <div className="pickup-event-title">
          {eventInfo.event.title}
        </div>
        {materials && materials.length > 0 && (
          <div className="pickup-event-materials">
            {materials.map(m => t(`materials.${m}`).charAt(0)).join('')}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="pickup-calendar-container">
      <div className="page-header">
        <h1>{t('pickup.calendarView')}</h1>
        <div className="view-toggle">
          <button 
            className="btn-text" 
            onClick={() => navigate('/pickups')}
          >
            {t('pickup.listView')}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/pickups/new')}
          >
            {t('pickup.scheduleNew')}
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <h4>{t('pickup.legend')}</h4>
        <ul>
          <li><span className="legend-dot pickup-status-pending"></span> {t('pickup.status.pending')}</li>
          <li><span className="legend-dot pickup-status-scheduled"></span> {t('pickup.status.scheduled')}</li>
          <li><span className="legend-dot pickup-status-in_progress"></span> {t('pickup.status.in_progress')}</li>
          <li><span className="legend-dot pickup-status-completed"></span> {t('pickup.status.completed')}</li>
          <li><span className="legend-dot pickup-status-cancelled"></span> {t('pickup.status.cancelled')}</li>
        </ul>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
        locale={navigator.language.split('-')[0]} // Use browser locale
      />
    </div>
  );
};

export default PickupCalendar;