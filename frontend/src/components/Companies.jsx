import { useEffect, useState } from "react";
import useSafeTranslation from '../hooks/useSafeTranslation';
import Card from './Card';
import { getCompanies } from "../api";

export default function Companies() {
  const { t } = useSafeTranslation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompaniesList();
  }, []);

  const fetchCompaniesList = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (_err) {
      setError("Failed to fetch companies.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>{error}</div></Card>;

  return (
    <Card>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("companies")}</h2>
      {companies.length === 0 ? (
        <div>No companies found</div>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {companies.map(c => (
            <li key={c.id} className="flex flex-col items-center bg-primary-light text-white rounded-card p-4">
              <span className="text-3xl mb-2">{c.icon}</span>
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}






