import React, { useEffect, useState } from "react";
import useSafeTranslation from '../hooks/useSafeTranslation';
import { getVehicles } from "../services/api";
// import Card from "./Card"; // غير مستخدم حالياً

export default function Vehicles() {
  const { t } = useSafeTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVehiclesList();
  }, []);

  const fetchVehiclesList = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      // Some mocks return { items: [...] } while others return an array
      const list = Array.isArray(data) ? data : (data && data.items) ? data.items : [];
      setVehicles(list);
    } catch (_err) {
      setError("Failed to fetch vehicles.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("vehicles")}</h2>
      <div className="h-48 bg-primary-light rounded-card mb-4 flex items-center justify-center text-white">[Map + Truck Icons]</div>
      {vehicles.length === 0 ? (
        <div>No vehicles found</div>
      ) : (
        <ul>
          {vehicles.map(v => (
            <li key={v.id} className="flex justify-between mb-2">
              <span>{v.name} ({v.location})</span>
              <span className="font-bold text-primary-dark">{t("pricing")}: {v.price}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



