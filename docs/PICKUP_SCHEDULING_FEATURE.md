# Enhanced Pickup Scheduling Feature

## Overview

The Enhanced Pickup Scheduling feature provides users with more flexible and powerful options for scheduling recycling pickups. Users can select specific time slots, set up recurring pickups, and view their pickup schedule in a calendar format.

## Features

### Time Slot Selection

- Users can choose from multiple time slots (Morning, Afternoon, Evening)
- The system checks availability for each time slot on the selected date
- Unavailable time slots are disabled to prevent double-booking

### Recurring Pickups

- Users can set up recurring pickups with multiple frequency options:
  - Weekly
  - Bi-weekly (every 2 weeks)
  - Monthly
- Each recurring pickup includes an end date
- The system provides a preview of upcoming recurring pickup dates

### Calendar View

- Interactive calendar view showing all scheduled pickups
- Different colors for pickup status (pending, scheduled, in progress, completed, cancelled)
- Visual indicators for recurring pickups
- Click on a date to schedule a new pickup for that date
- Click on an existing pickup to view details

## Technical Implementation

### Backend

- Enhanced `PickupRequest` model with fields for time slots and recurrence
- API endpoints for:
  - Available time slots for a specific date
  - Generating recurring dates based on recurrence pattern
  - Creating, updating, and cancelling pickups

### Frontend

- Calendar integration using FullCalendar library
- Date selection using React Calendar
- Time slot selection with availability indicators
- Recurring pickup configuration UI
- List view with enhanced pickup details

## Dependencies

- FullCalendar (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/interaction)
- React Calendar
- Python dateutil (backend)