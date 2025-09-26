import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function GenericScreen({ apiCall, titleKey, emptyKey, darkMode, renderItem, onSuccess }) {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiCall();
      setData(res || []);
      if (onSuccess) setNotification(onSuccess);
    } catch {
      setError(t(`failed_load_${titleKey.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={`skeleton ${darkMode ? "dark" : ""}`}>{t("loading")}</div>;
  if (error) return <div className={`error ${darkMode ? "dark" : ""}`}>{error}</div>;

  return (
    <div className={darkMode ? "dark bg-gray-800 text-white p-4 rounded" : "bg-white text-gray-800 p-4 rounded"}>
      <h1 className="font-bold text-xl mb-4">{t(titleKey)}</h1>
      {notification && <div className="notification mb-2">{notification}</div>}
      {data.length === 0 ? <div>{t(emptyKey)}</div> : (
        <ul>
          {data.map((item, idx) => (
            <li key={item.id || idx}>{renderItem ? renderItem(item) : (item.name || item.type || item.id)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
