import PropTypes from 'prop-types';
import './TimeSlotSelector.css';

const TimeSlotSelector = ({ 
  availableSlots, 
  selectedDate, 
  selectedTimeSlot, 
  onDateChange, 
  onTimeSlotChange 
}) => {
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="time-slot-selector">
      <div className="date-selector">
        {availableSlots.map(daySlot => (
          <button
            key={daySlot.date}
            className={`date-button ${selectedDate === daySlot.date ? 'selected' : ''}`}
            onClick={() => onDateChange(daySlot.date)}
          >
            {formatDate(daySlot.date)}
          </button>
        ))}
      </div>
      
      {selectedDate && (
        <div className="time-slots">
          <h3>Available Time Slots</h3>
          {availableSlots
            .find(slot => slot.date === selectedDate)?.slots
            .map(timeSlot => (
              <button
                key={timeSlot.slot}
                className={`time-slot-button ${selectedTimeSlot === timeSlot.slot ? 'selected' : ''} ${!timeSlot.available ? 'unavailable' : ''}`}
                onClick={() => timeSlot.available && onTimeSlotChange(timeSlot.slot)}
                disabled={!timeSlot.available}
              >
                {timeSlot.slot}
                {!timeSlot.available && <span className="unavailable-text">Fully Booked</span>}
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
};

TimeSlotSelector.propTypes = {
  availableSlots: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      slots: PropTypes.arrayOf(
        PropTypes.shape({
          slot: PropTypes.string.isRequired,
          available: PropTypes.bool.isRequired
        })
      ).isRequired
    })
  ).isRequired,
  selectedDate: PropTypes.string,
  selectedTimeSlot: PropTypes.string,
  onDateChange: PropTypes.func.isRequired,
  onTimeSlotChange: PropTypes.func.isRequired
};

export default TimeSlotSelector;