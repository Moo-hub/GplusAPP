import { useState, useEffect } from 'react';

export function useEnvironmentalImpact() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personalData, setPersonalData] = useState(null);
  const [communityData, setCommunityData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function fetchImpacts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/environmental/impacts', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();

        if (!mounted) return;

        // Lightweight mapping: backend currently returns an array of items.
        // Populate leaderboardData with returned items and keep other sections null
        setLeaderboardData(Array.isArray(body) ? body : []);
        setPersonalData(null);
        setCommunityData(null);
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchImpacts();

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error, personalData, communityData, leaderboardData };
}

export default useEnvironmentalImpact;
