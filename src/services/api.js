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

const api = axios.create({
  baseURL: 'https://sua-api-autotruck.com', // Substitua pela URL real do projeto
});

export const agendamentoService = {
  // GET /services/slots-disponiveis?data=YYYY-MM-DD
  getHorariosDisponiveis: async (data) => {
    try {
      const response = await api.get(`/services/slots-disponiveis?data=${data}`);
      return response.data; // Retorna array: ['08:00', '10:00', ...]
    } catch (error) {
      console.error("Erro ao buscar horários", error);
      // Fallback para teste se a API ainda não estiver pronta:
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
      return response.data; // Esperado: { proximosServicos: [], historicoServicos: [] }
    } catch (error) {
      console.error("Erro ao listar serviços", error);
      return { proximosServicos: [], historicoServicos: [] };
    }
  }
};

export default api;
