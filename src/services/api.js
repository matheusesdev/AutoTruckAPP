import axios from 'axios';
import { logoutAndRedirectToLogin } from './authSession';

// Cliente HTTP central da aplicação.
// Usa 10.0.2.2 para apontar para o localhost da máquina host no emulador Android.
const api = axios.create({
  baseURL: 'http://10.0.2.2:3001/api',
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
