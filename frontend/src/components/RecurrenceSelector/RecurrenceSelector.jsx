import PropTypes from 'prop-types';
import './RecurrenceSelector.css';

const RecurrenceSelector = ({ 
  isRecurring, 
  recurrenceType, 
  recurrenceEndDate,
  onRecurringChange,
  onRecurrenceTypeChange,
  onEndDateChange
}) => {
  return (
    <div className="recurrence-selector">
      <div className="recurring-toggle">
        <label className="recurring-label">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
          />
          <span>Make this a recurring pickup</span>
        </label>
      </div>

      {isRecurring && (
        <div className="recurrence-options">
          <div className="recurrence-type">
            <label htmlFor="recurrence-type">Repeat</label>
            <select
              id="recurrence-type"
              value={recurrenceType}
              onChange={(e) => onRecurrenceTypeChange(e.target.value)}
              className="recurrence-select"
            >
              <option value="weekly">Weekly</option>
              <option value="bi_weekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="recurrence-end">
            <label htmlFor="end-date">Until</label>
            <input
              id="end-date"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="end-date-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

RecurrenceSelector.propTypes = {
  isRecurring: PropTypes.bool.isRequired,
  recurrenceType: PropTypes.oneOf(['weekly', 'bi_weekly', 'monthly']).isRequired,
  recurrenceEndDate: PropTypes.string,
  onRecurringChange: PropTypes.func.isRequired,
  onRecurrenceTypeChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired
};

export default RecurrenceSelector;