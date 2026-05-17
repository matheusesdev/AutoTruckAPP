// src/services/emergenciaService.js
import api from './api';

/**
 * Enviar solicitação de atendimento emergencial
 * @param {Object} dados - Dados da emergência
 * @param {number} dados.latitude - Latitude do usuário
 * @param {number} dados.longitude - Longitude do usuário
 * @param {string} dados.endereco - Endereço legível do usuário
 * @param {string} dados.descricao - Descrição do problema
 */
export const solicitarEmergencia = async (dados) => {
  const response = await api.post('/emergency', {
    latitude: dados.latitude,
    longitude: dados.longitude,
    endereco: dados.endereco,
    descricao: dados.descricao,
  });
  return response.data;
};

/**
 * Buscar status do atendimento emergencial por ID ou ativo
 */
export const buscarEmergenciaAtiva = async (id = null) => {
  const url = id ? `/emergency/${id}` : '/emergency/active';
  const response = await api.get(url);
  return response.data;
};