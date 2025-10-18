import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPaymentMethods } from "../api/payments";
import Card from "./Card";

export default function Payment() {
  const { t } = useTranslation();
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
            // Use translation when available; if t(key) returns the key itself,
            // fall back to a humanized label to keep UI readable and tests stable.
            let label = t(key);
            try {
              if (typeof label === 'string' && label === key) {
                label = String(key).split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
              }
            } catch (e) {
              // fallback to original name
              label = name;
            }
            return (
              <button
                key={key}
                className="w-full bg-primary-dark text-white py-2 rounded-card text-lg hover:bg-primary-light transition"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}






