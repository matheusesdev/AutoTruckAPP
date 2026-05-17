// src/screens/AcompanhamentoEmergenciaScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { emergenciaService } from '../services/emergenciaService';
import { theme } from '../utils/theme';

const STATUS_CONFIG = {
  aguardando: {
    label: 'Aguardando',
    icon: 'time-outline',
    color: '#F59E0B',
    descricao: 'Sua solicitação foi recebida. Aguardando mecânico disponível.',
  },
  aceito: {
    label: 'Mecânico a caminho',
    icon: 'car-outline',
    color: '#3B82F6',
    descricao: 'Um mecânico foi designado e está a caminho.',
  },
  em_atendimento: {
    label: 'Em atendimento',
    icon: 'construct-outline',
    color: '#E87722',
    descricao: 'O mecânico chegou e está realizando o atendimento.',
  },
  concluido: {
    label: 'Concluído',
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    descricao: 'Atendimento concluído com sucesso!',
  },
  cancelado: {
    label: 'Cancelado',
    icon: 'close-circle-outline',
    color: '#EF4444',
    descricao: 'O atendimento foi cancelado.',
  },
};

const ETAPAS = ['aguardando', 'aceito', 'em_atendimento', 'concluido'];
const POLLING_INTERVAL = 10000; // 10 segundos

export default function AcompanhamentoEmergenciaScreen({ route, navigation }) {
  const { emergenciaId } = route.params || {};

  const [emergencia, setEmergencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const pollingRef = useRef(null);

  const buscarStatus = useCallback(async () => {
    try {
      const dados = await emergenciaService.buscarEmergenciaAtiva(emergenciaId);
      setEmergencia(dados);
      setErro(null);

      // Para o polling se concluído ou cancelado
      if (dados?.status === 'concluido' || dados?.status === 'cancelado') {
        clearInterval(pollingRef.current);
      }
    } catch (error) {
      setErro('Não foi possível obter o status do atendimento.');
    } finally {
      setLoading(false);
    }
  }, [emergenciaId]);

  useEffect(() => {
    buscarStatus();

    // Polling a cada 10 segundos
    pollingRef.current = setInterval(buscarStatus, POLLING_INTERVAL);

    return () => clearInterval(pollingRef.current);
  }, [buscarStatus]);

  const indiceEtapaAtual = ETAPAS.indexOf(emergencia?.status);
  const statusConfig = STATUS_CONFIG[emergencia?.status] || STATUS_CONFIG.aguardando;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Obtendo status do atendimento...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centered}>
        <Ionicons name="wifi-outline" size={48} color="#ccc" />
        <Text style={styles.erroText}>{erro}</Text>
        <TouchableOpacity style={styles.btnTentar} onPress={buscarStatus}>
          <Text style={styles.btnTentarTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status principal */}
      <View style={[styles.statusCard, { borderColor: statusConfig.color }]}>
        <Ionicons name={statusConfig.icon} size={48} color={statusConfig.color} />
        <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
        <Text style={styles.statusDescricao}>{statusConfig.descricao}</Text>

        {/* Tempo estimado */}
        {emergencia?.tempo_estimado && emergencia?.status === 'aceito' && (
          <View style={styles.tempoContainer}>
            <Ionicons name="time" size={18} color={theme.colors.primary} />
            <Text style={styles.tempoTexto}>
              Chegada estimada: <Text style={styles.tempoBold}>{emergencia.tempo_estimado} min</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Linha do tempo */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Progresso do atendimento</Text>
        <View style={styles.timeline}>
          {ETAPAS.map((etapa, index) => {
            const config = STATUS_CONFIG[etapa];
            const ativo = index <= indiceEtapaAtual;
            const atual = index === indiceEtapaAtual;

            return (
              <View key={etapa} style={styles.timelineItem}>
                <View style={styles.timelineEsquerda}>
                  <View style={[
                    styles.timelinePonto,
                    ativo && { backgroundColor: config.color },
                    atual && styles.timelinePontoAtual,
                  ]}>
                    {ativo && (
                      <Ionicons name={config.icon} size={14} color="#FFF" />
                    )}
                  </View>
                  {index < ETAPAS.length - 1 && (
                    <View style={[
                      styles.timelineLinha,
                      ativo && index < indiceEtapaAtual && { backgroundColor: config.color },
                    ]} />
                  )}
                </View>
                <View style={styles.timelineDireita}>
                  <Text style={[
                    styles.timelineLabel,
                    ativo && { color: config.color, fontWeight: '700' },
                  ]}>
                    {config.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Informações do mecânico */}
      {emergencia?.mecanico && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Mecânico designado</Text>
          <View style={styles.mecanicoCard}>
            <View style={styles.mecanicoAvatar}>
              <Ionicons name="person" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.mecanicoInfo}>
              <Text style={styles.mecanicoNome}>{emergencia.mecanico.nome}</Text>
              {emergencia.mecanico.telefone && (
                <Text style={styles.mecanicoTelefone}>{emergencia.mecanico.telefone}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Detalhes da solicitação */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Detalhes da solicitação</Text>
        <View style={styles.detalhesCard}>
          {emergencia?.endereco && (
            <View style={styles.detalheRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.accent} />
              <Text style={styles.detalheTexto}>{emergencia.endereco}</Text>
            </View>
          )}
          {emergencia?.descricao && (
            <View style={styles.detalheRow}>
              <Ionicons name="document-text-outline" size={16} color={theme.colors.accent} />
              <Text style={styles.detalheTexto}>{emergencia.descricao}</Text>
            </View>
          )}
        </View>
      </View>

      {/* TODO: aplicar layout UI-06 nos cards de status e mecânico */}

      {/* Atualização automática */}
      <Text style={styles.atualizacaoTexto}>
        🔄 Atualizando automaticamente a cada 10 segundos
      </Text>

      <TouchableOpacity style={styles.btnAtualizar} onPress={buscarStatus}>
        <Ionicons name="refresh" size={16} color={theme.colors.primary} />
        <Text style={styles.btnAtualizarTexto}>Atualizar agora</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 14,
  },
  erroText: {
    marginTop: theme.spacing.md,
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  btnTentar: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  btnTentarTexto: {
    color: '#FFF',
    fontWeight: '700',
  },
  statusCard: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#FAFAFA',
    ...theme.shadow.sm,
  },
  statusLabel: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  statusDescricao: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: theme.spacing.xs,
  },
  tempoTexto: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  tempoBold: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  secao: {
    marginBottom: theme.spacing.lg,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  timeline: {
    paddingLeft: theme.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineEsquerda: {
    alignItems: 'center',
    width: 32,
  },
  timelinePonto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePontoAtual: {
    ...theme.shadow.sm,
  },
  timelineLinha: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD',
    marginVertical: 2,
  },
  timelineDireita: {
    flex: 1,
    paddingLeft: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    justifyContent: 'center',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#999',
  },
  mecanicoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  mecanicoAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8EEF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mecanicoInfo: {
    flex: 1,
  },
  mecanicoNome: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  mecanicoTelefone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  detalhesCard: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  detalheRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  detalheTexto: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  atualizacaoTexto: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  btnAtualizar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  btnAtualizarTexto: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});