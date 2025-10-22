import PropTypes from 'prop-types';
import './ScreenReaderOnly.css';

export default function ScreenReaderOnly({ children }) {
  return <span className="sr-only">{children}</span>;
}

ScreenReaderOnly.propTypes = {
  children: PropTypes.node.isRequired
};