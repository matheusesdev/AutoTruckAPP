import axios from 'axios';

// Cliente HTTP central da aplicação.
// Mantive o 10.0.2.2 que é o padrão para emuladores Android acessarem o localhost.
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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