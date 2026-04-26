const { HORARIOS_FIXOS } = require('../utils/horarios');

let agendamentos = [];

const getSlotsDisponiveis = (data) => {
  // Filtrar agendamentos da data
  const ocupados = agendamentos
    .filter(a => a.data_agendada.startsWith(data))
    .map(a => a.hora);

  // Retornar horários livres
  return HORARIOS_FIXOS.filter(h => !ocupados.includes(h));
};

const criarAgendamento = (data) => {
  agendamentos.push(data);
  return data;
};

const listarServicos = (userId) => {
  const agora = new Date();

  const userServices = agendamentos.filter(a => a.user_id === userId);

  const proximos = [];
  const historico = [];

  userServices.forEach(s => {
    const dataServico = new Date(s.data_agendada);

    if (dataServico >= agora && s.status !== 'finalizado') {
      proximos.push(s);
    } else {
      historico.push(s);
    }
  });

  proximos.sort((a, b) => new Date(a.data_agendada) - new Date(b.data_agendada));
  historico.sort((a, b) => new Date(b.data_agendada) - new Date(a.data_agendada));

  return {
    proximosServicos: proximos,
    historicoServicos: historico
  };
};

module.exports = {
  getSlotsDisponiveis,
  criarAgendamento,
  listarServicos
};

const cancelarAgendamento = (id, userId) => {
  const agendamento = agendamentos.find(a => a.id == id);

  if (!agendamento) {
    return { error: 'Agendamento não encontrado', status: 404 };
  }

  if (agendamento.user_id !== userId) {
    return { error: 'Acesso negado', status: 403 };
  }

  if (agendamento.status !== 'agendado') {
    return {
      error: 'Não é possível cancelar um serviço que já está em andamento',
      status: 400
    };
  }

  agendamento.status = 'cancelado';

  return { data: agendamento };
};