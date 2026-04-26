const service = require('./services.service');

// GET /services/slots-disponiveis
exports.getSlots = (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: 'Data é obrigatória' });
  }

  const slots = service.getSlotsDisponiveis(data);

  res.json(slots);
};

// POST /services
exports.create = (req, res) => {
  const { tipo_servico, veiculo_id, data_agendada, observacoes } = req.body;

  const data = new Date(data_agendada);
  const agora = new Date();

  if (data <= agora) {
    return res.status(400).json({ error: 'Data deve ser futura' });
  }

  const hora = data_agendada.split('T')[1].substring(0,5);

  const disponiveis = service.getSlotsDisponiveis(data_agendada.split('T')[0]);

  if (!disponiveis.includes(hora)) {
    return res.status(400).json({ error: 'Horário indisponível' });
  }

  const novo = {
    id: Date.now(),
    tipo_servico,
    veiculo_id,
    data_agendada,
    hora,
    observacoes,
    status: 'agendado',
    user_id: req.user?.id || 1
  };

  service.criarAgendamento(novo);

  res.status(201).json(novo);
};

// GET /services
exports.list = (req, res) => {
  const userId = req.user?.id || 1;

  const data = service.listarServicos(userId);

  res.json(data);
};

exports.cancelar = (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || 1;

  const result = service.cancelarAgendamento(id, userId);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.data);
};