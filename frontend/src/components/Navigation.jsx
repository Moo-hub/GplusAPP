import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import "./Navigation.css";

export default function Navigation() {
  const { t } = useTranslation();
  const auth = useAuth();

  // If useAuth returns null (tests rendering AppContent without provider)
  // treat as unauthenticated and render nothing.
  if (!auth || !auth.currentUser) return null;

  const { currentUser, logout } = auth;
  
  return (
    <>
      <div className="user-info" data-testid="user-info">
        {currentUser && (
          <span className="welcome-user" data-testid="welcome-message">
            {t('auth.welcome')}, {currentUser.name}
          </span>
        )}
        <Button variant="secondary" size="small" onClick={logout} data-testid="logout-button">
          {t('auth.logout')}
        </Button>
      </div>
      
      <nav className="app-navigation" data-testid="side-navigation">
        <ul className="nav-list" data-testid="nav-list">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.dashboard')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/points" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.points')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/pickups" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.pickups')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/companies" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.companies')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.profile')}
            </NavLink>
          </li>
          {currentUser.is_admin && (
            <li className="admin-nav-item" data-testid="admin-nav-item">
              <NavLink to="/admin/performance" className={({ isActive }) => isActive ? 'active' : ''}>
                {t('nav.performance')}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}