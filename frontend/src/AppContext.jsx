import React, { createContext, useContext, useState, useMemo } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children, initialState = {} }) => {
  const [points, setPoints] = useState(initialState.points || 0);
  const [pickups, setPickups] = useState(initialState.pickups || []);
  const [vehicles, setVehicles] = useState(initialState.vehicles || []);
  const [companies, setCompanies] = useState(initialState.companies || []);

  const value = useMemo(
    () => ({ points, setPoints, pickups, setPickups, vehicles, setVehicles, companies, setCompanies }),
    [points, pickups, vehicles, companies]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
};

export default AppContext;
