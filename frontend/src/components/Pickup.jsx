import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import { toast } from 'react-toastify';

// Minimal Pickup component used by tests. Keeps imports and exports simple
// to avoid multiple-evaluation issues during transformation.
const Pickup = () => {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getPickups();
        if (mounted) setPickups(Array.isArray(data) ? data : []);
      } catch (_) {
        if (mounted) setPickups([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      const created = await api.createPickup({ type: 'paper' });
      if (created) setPickups((p) => [...p, created]);
      toast('Request Pickup Request Now');
    } catch (e) {
      toast('Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Request Pickup</h2>
      {loading ? (
        <div>Loading</div>
      ) : (
        <ul>
          {pickups.map((p, i) => <li key={p.id || i}>{p.type}</li>)}
        </ul>
      )}
      <button onClick={handleRequest} disabled={submitting}>Request Now</button>
    </div>
  );
};

export default Pickup;
