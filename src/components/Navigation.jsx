import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import "./Navigation.css";

export default function Navigation() {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  
  if (!currentUser) return null; // Don't show navigation for unauthenticated users
  
  return (
    <>
      <div className="user-info">
        {currentUser && (
          <span className="welcome-user">
            {t('auth.welcome')}, {currentUser.name}
          </span>
        )}
        <Button variant="secondary" size="small" onClick={logout}>
          {t('auth.logout')}
        </Button>
      </div>
      
      <nav className="app-navigation">
        <ul className="nav-list">
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
        </ul>
      </nav>
    </>
  );
}