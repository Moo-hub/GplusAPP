import React, { useEffect, useState } from "react";
import Card from "./Card";
import { useTranslation } from "react-i18next";
import { getPaymentMethods } from "../services/api";

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
    } catch (err) {
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
          {methods.map(method => (
            <button key={method} className="w-full bg-primary-dark text-white py-2 rounded-card text-lg hover:bg-primary-light transition">{t(method.toLowerCase().replace(' ', '_'))}</button>
          ))}
        </div>
      )}
    </Card>
  );
}
