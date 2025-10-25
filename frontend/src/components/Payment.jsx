import React, { useEffect, useState } from "react";
import useSafeTranslation from '../hooks/useSafeTranslation';
import { getPaymentMethods } from "../api/payments";
import Card from './Card';

export default function Payment() {
  const { t } = useSafeTranslation();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const data = await getPaymentMethods();
      setMethods(data);
    } catch (_err) {
      setError("Failed to fetch payment methods.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><div>Loading...</div></Card>;
  if (error) return <Card><div>{error}</div></Card>;

  return (
    <Card>
      <h2 className="text-primary-dark text-lg font-bold mb-2">{t("payment")}</h2>
      {methods.length === 0 ? (
        <div>No payment methods found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {methods.map((method) => {
            // Support both string-based and object-based method representations
            const name = typeof method === 'string' ? method : (method && (method.name || method.id) ? (method.name || String(method.id)) : String(method));
            const key = String(name).toLowerCase().replace(/\s+/g, "_"); // handle multi-word labels
            return (
              <button
                key={key}
                className="w-full bg-primary-dark text-white py-2 rounded-card text-lg hover:bg-primary-light transition"
              >
                {t(key)}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}






