import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPickupSchedule } from "../api";

export default function PickupSchedule() {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await getPickupSchedule();
      setSchedule(data);
    } catch (_err) {
      setError("Failed to fetch schedule.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>Failed to load schedule</div></Card>;

  return (
    <Card>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("pickup_schedule")}</h2>
      <div>
        <h3 className="font-semibold mb-1">{t("upcoming")}</h3>
        {Array.isArray(schedule.upcoming) && schedule.upcoming.length === 0 ? (
          <div>No pickups found</div>
        ) : (
          <ul>
            {schedule.upcoming.map(item => (
              <li key={item.id} className="mb-1">{item.date} - {item.type || item.status}</li>
            ))}
          </ul>
        )}
        <h3 className="font-semibold mt-4 mb-1">{t("past")}</h3>
        {Array.isArray(schedule.past) && schedule.past.length === 0 ? (
          <div>No schedule found</div>
        ) : (
          <ul>
            {schedule.past.map(item => (
              <li key={item.id} className="mb-1">{item.date} - {item.type || item.status}</li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}






