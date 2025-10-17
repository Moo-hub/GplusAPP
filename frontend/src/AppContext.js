import { createContext, useContext, useState, useEffect } from 'react';
import { fetchPoints, fetchPickups, fetchVehicles, fetchCompanies } from './api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [points, setPoints] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchPoints().then(setPoints);
    fetchPickups().then(setPickups);
    fetchVehicles().then(setVehicles);
    fetchCompanies().then(setCompanies);
  }, []);

  return (
    <AppContext.Provider value={{ points, pickups, vehicles, companies }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

