import React from "react";
import PropTypes from "prop-types";
import "./Button.css";

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  type = "button",
  disabled = false,
  ariaLabel,
  className = "",
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? "btn-block" : "",
    className
  ].join(" ").trim();

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || undefined}
      data-testid="button"
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};