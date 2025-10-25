import React from 'react';
import PropTypes from "prop-types";
import "./Card.css";

export default function Card({
  title,
  children,
  hoverable = false,
  variant = "light",
  onClick,
}) {
  const classes = [
    "card",
    hoverable ? "card-hoverable" : "",
    variant === "dark" ? "card-dark" : "card-light",
  ].join(" ");

  return (
    <div className={classes} onClick={onClick} data-testid="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  hoverable: PropTypes.bool,
  variant: PropTypes.oneOf(["light", "dark"]),
  onClick: PropTypes.func,
};


