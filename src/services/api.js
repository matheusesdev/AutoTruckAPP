import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

import { logoutAndRedirectToLogin } from './authSession';

function getDevServerHost() {
  const expoHostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost;
  if (expoHostUri && typeof expoHostUri === 'string') {
    return expoHostUri.split(':')[0];
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL || typeof scriptURL !== 'string') return null;

  const match = scriptURL.match(/\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
}

function resolveApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  // Em dispositivo físico via Expo Go, usa o host do bundle (IP da máquina dev).
  const devHost = getDevServerHost();
  if (devHost) return `http://${devHost}:3001/api`;

  // Fallback para simuladores/emuladores.
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';
}

const API_BASE_URL = resolveApiBaseUrl();

function isNotFound(error) {
  return error?.response?.status === 404;
}

function normalizeListPayload(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;

  return [];
}

async function getWithFallback(paths, config) {
  let lastError;

  for (const path of paths) {
    try {
      const response = await api.get(path, config);
      return response.data;
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        await logoutAndRedirectToLogin();
      } finally {
        isHandlingUnauthorized = false;
      }
    }

    return Promise.reject(error);
  }
);

export const agendamentoService = {
  getHorariosDisponiveis: async (data) => {
    try {
      const response = await api.get(`/services/slots-disponiveis?data=${data}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar horários', error);
      return ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    }
  },

  criarAgendamento: async (dados) => {
    try {
      const response = await api.post('/services', dados);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao agendar';
    }
  },

  listarServicos: async () => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar serviços', error);
      return { proximosServicos: [], historicoServicos: [] };
    }
  },

  cancelarAgendamento: async (id) => {
    try {
      const response = await api.patch(`/services/${id}/cancelar`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao cancelar agendamento';
    }
  },

  obterAgendamento: async (id) => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao obter agendamento';
    }
  },

  reagendarAgendamento: async (id, dados) => {
    try {
      const response = await api.put(`/services/${id}`, dados);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao reagendar agendamento';
    }
  },

  obterDatasDisponiveis: async () => {
    try {
      const response = await api.get('/services/datas-disponiveis');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis', error);
      return {};
    }
  },
};

// Busca de peças no backend. Suporta pesquisa por termo, veículo, código de barras e VIN.
export const fetchParts = async ({ search = '', page = 1, limit = 20, veiculo_id = null, codigo = null, vin = null } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (veiculo_id) params.veiculo_id = veiculo_id;
  if (codigo) params.codigo = codigo;
  if (vin) params.vin = vin;

  const response = await api.get('/parts', { params });
  return response.data;
};

export const fetchPartById = async (id) => {
  const response = await api.get(`/parts/${id}`);
  return response.data;
};

export const fetchVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

// ===== Perfil =====
export const perfilService = {
  obterPerfil: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao obter perfil';
    }
  },

  atualizarPerfil: async (dados) => {
    try {
      const response = await api.patch('/users/profile', dados);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao atualizar perfil';
    }
  },
};

// ===== Orçamentos =====
export const orcamentoService = {
  solicitarOrcamento: async (dados) => {
    try {
      const response = await api.post('/quotations', dados);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao solicitar orçamento';
    }
  },

  listarOrcamentos: async (status = null) => {
    try {
      const params = {};
      if (status) params.status = status;
      const data = await getWithFallback(['/quotations', '/quotes', '/orcamentos'], { params });
      return { quotations: normalizeListPayload(data, ['quotations', 'quotes', 'orcamentos']) };
    } catch (error) {
      if (!isNotFound(error)) {
        console.error('Erro ao listar orçamentos', error);
      }
      return { quotations: [] };
    }
  },

  obterOrcamento: async (id) => {
    try {
      const response = await api.get(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao obter orçamento';
    }
  },

  cancelarOrcamento: async (id) => {
    try {
      const response = await api.patch(`/quotations/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao cancelar orçamento';
    }
  },
};

// ===== Pedidos =====
export const pedidoService = {
  listarPedidos: async () => {
    try {
      const data = await getWithFallback(['/orders', '/pedidos']);
      return { orders: normalizeListPayload(data, ['orders', 'pedidos']) };
    } catch (error) {
      if (!isNotFound(error)) {
        console.error('Erro ao listar pedidos', error);
      }
      return { orders: [] };
    }
  },

  obterPedido: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao obter pedido';
    }
  },

  rastrearPedido: async (id) => {
    try {
      const response = await api.get(`/orders/${id}/tracking`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao rastrear pedido';
    }
  },
};

// ===== Notificações =====
export const notificacaoService = {
  listarNotificacoes: async () => {
    try {
      const data = await getWithFallback(['/notifications', '/notificacoes']);
      return { notifications: normalizeListPayload(data, ['notifications', 'notificacoes']) };
    } catch (error) {
      if (!isNotFound(error)) {
        console.error('Erro ao listar notificações', error);
      }
      return { notifications: [] };
    }
  },

  marcarComoLida: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao marcar notificação como lida';
    }
  },
};

export default api;
