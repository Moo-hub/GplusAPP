import PropTypes from "prop-types";
import "./Badge.css";

export default function Badge({ children, variant = "default", size = "medium" }) {
  const classes = [
    "badge",
    `badge-${variant}`,
    `badge-${size}`
  ].join(" ");
  
  return (
    <span className={classes} data-testid="badge">
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "success", "warning", "danger", "info"]),
  size: PropTypes.oneOf(["small", "medium", "large"])
};