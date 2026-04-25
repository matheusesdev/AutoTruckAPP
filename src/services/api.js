import axios from 'axios';

// Cliente HTTP central da aplicação.
// Usa 10.0.2.2 para apontar para o localhost da máquina host no emulador Android.
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
