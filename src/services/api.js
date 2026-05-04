import axios from 'axios';
import { Platform } from 'react-native';

import { logoutAndRedirectToLogin } from './authSession';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api');

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
};

export const fetchParts = async ({ search = '', page = 1, limit = 20, veiculo_id = null } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (veiculo_id) params.veiculo_id = veiculo_id;

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

export default api;
