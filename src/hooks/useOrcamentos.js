import { useState, useEffect, useCallback } from 'react';
import { orcamentoService } from '../services/api';

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrcamentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orcamentoService.listarOrcamentos();
      const items = Array.isArray(response) ? response : response.quotations || [];
      setOrcamentos(items);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os orçamentos');
      setOrcamentos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrcamentos();
  }, [fetchOrcamentos]);

  return {
    orcamentos,
    isLoading,
    error,
    refresh: fetchOrcamentos,
  };
}
