import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export function useEnvironmentalImpact() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personalData, setPersonalData] = useState(null);
  const [communityData, setCommunityData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    axios.get('/api/v1/environmental/impacts')
      .then(res => {
        if (!alive) return;
        const data = res.data;
        setPersonalData(data.personal);
        setCommunityData(data.community);
        setLeaderboardData(data.leaderboard);
      })
      .catch(err => {
        if (!alive) return;
        setError(t('environmental.fetchError'));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [t]);

  return { loading, error, personalData, communityData, leaderboardData };
}
