import axios from 'axios';
<<<<<<< HEAD

// Cliente HTTP central da aplicação.
// Mantive o 10.0.2.2 que é o padrão para emuladores Android acessarem o localhost.
=======
import { Platform } from 'react-native';
import { logoutAndRedirectToLogin } from './authSession';
 
// Cliente HTTP central da aplicação.
// Web usa localhost. Android usa 10.0.2.2 para acessar o host local.
const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3001/api' : 'http://10.0.2.2:3001/api';
 
>>>>>>> origin/main
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
<<<<<<< HEAD

export const agendamentoService = {
  // GET /services/slots-disponiveis?data=YYYY-MM-DD
  getHorariosDisponiveis: async (data) => {
    try {
      const response = await api.get(`/services/slots-disponiveis?data=${data}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar horários", error);
      return ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    }
  },

  // POST /services
  criarAgendamento: async (dados) => {
    try {
      const response = await api.post('/services', dados);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Erro ao agendar";
    }
  },

  // GET /services
  listarServicos: async () => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      console.error("Erro ao listar serviços", error);
      return { proximosServicos: [], historicoServicos: [] };
    }
  },

  // NOVO: PATCH /services/:id/cancelar
  // Adicionado para a tarefa AT-23
  cancelarAgendamento: async (id) => {
    try {
      const response = await api.patch(`/services/${id}/cancelar`);
      return response.data;
    } catch (error) {
      // Repassa a mensagem de erro vinda da API (ex: "Não é possível cancelar...")
      throw error.response?.data?.message || "Erro ao cancelar agendamento";
    }
  }
};

export default api;
=======
 
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
 
export default api;
 
// AT-11 — Catálogo de Peças
export const fetchParts = async ({ search = '', page = 1, limit = 20, veiculo_id = null } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (veiculo_id) params.veiculo_id = veiculo_id;
  const response = await api.get('/parts', { params });
  return response.data;
};
 
// AT-13 — Detalhe de Peça
export const fetchPartById = async (id) => {
  const response = await api.get(`/parts/${id}`);
  return response.data;
};
 
// AT-12 — Veículos do usuário (para seletor de compatibilidade)
export const fetchVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};
>>>>>>> origin/main
