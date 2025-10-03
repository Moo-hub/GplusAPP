import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getPickups, createPickup } from "../api";

export default function Pickup() {
  const { t } = useTranslation();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const data = await getPickups();
      setPickups(data);
    } catch (_err) {
      setError("Failed to fetch pickups.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePickup = async () => {
    try {
      setCreating(true);
      const newPickup = await createPickup({ type: "recyclable", location: "Home" });
      setPickups((prev) => [...prev, newPickup]);
      alert("Pickup created successfully!");
    } catch {
      alert("Failed to create pickup.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>{error}</div></Card>;

  return (
    <Card>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("pickup")}</h2>
      <button
        className="w-full bg-primary-dark text-white py-2 rounded-card text-lg hover:bg-primary-light transition mb-4 disabled:opacity-50"
        onClick={handleCreatePickup}
        disabled={creating}
      >
        {creating ? t("request_now") + "..." : t("request_now")}
      </button>
      {pickups.length === 0 ? (
        <div>No pickups found</div>
      ) : (
        <ul>
          {pickups.map((p) => (
            <li key={p.id}>{p.type} - {p.location}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}




