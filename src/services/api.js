import axios from 'axios';
import { Platform } from 'react-native';
import { logoutAndRedirectToLogin } from './authSession';
 
// Cliente HTTP central da aplicação.
// Web usa localhost. Android usa 10.0.2.2 para acessar o host local.
const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3001/api' : 'http://10.0.2.2:3001/api';
 
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