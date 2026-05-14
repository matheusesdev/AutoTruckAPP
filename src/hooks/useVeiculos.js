import { useState, useEffect, useCallback } from 'react';
import { fetchVehicles } from '../services/api';

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVeiculos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchVehicles();
      const items = Array.isArray(response) ? response : response?.vehicles || [];
      setVeiculos(items);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os veículos');
      setVeiculos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVeiculos();
  }, [fetchVeiculos]);

  return {
    veiculos,
    isLoading,
    error,
    refresh: fetchVeiculos,
  };
}
