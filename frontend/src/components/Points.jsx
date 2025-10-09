import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { getPoints } from '../api/points';

export default function Points() {
  const { t } = useTranslation();
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const data = await getPoints();
      setPoints(data);
    } catch (_err) {
      setError("Failed to load points");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>{error}</div></Card>;

  return (
    <Card>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("my_points")}</h2>
      <div className="flex flex-col gap-2">
        {points?.total && (
          <div className="bg-primary-light text-white rounded-card p-4 flex justify-between items-center">
            <span>Total</span>
            <span className="font-bold">{points.total}</span>
          </div>
        )}
        <div className="bg-primary-light text-white rounded-card p-4 flex justify-between items-center">
          <span>{t("rewards")}</span>
          <span className="font-bold">
            {Array.isArray(points?.rewards) && points.rewards.length === 0 && 'No rewards found'}
            {Array.isArray(points?.rewards) && points.rewards.length > 0 && points.rewards.join(', ')}
            {!Array.isArray(points?.rewards) && points?.rewards}
          </span>
        </div>
      </div>
    </Card>
  );
}




