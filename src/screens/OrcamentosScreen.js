import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { orcamentoService } from '../services/api';
import { theme } from '../utils/theme';

export default function OrcamentosScreen({ navigation }) {
  const [orcamentos, setOrcamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'aguardando', 'respondido', 'cancelado'
  const [expandedId, setExpandedId] = useState(null);

  const statusConfig = {
    aguardando: { color: '#9CA3AF', label: 'Aguardando resposta' },
    em_analise: { color: '#F59E0B', label: 'Em análise' },
    respondido: { color: '#10B981', label: 'Respondido' },
    cancelado: { color: '#EF4444', label: 'Cancelado' },
    expirado: { color: '#6B7280', label: 'Expirado' },
  };

  const loadOrcamentos = useCallback(async (status = null) => {
    try {
      setIsLoading(true);
      const data = await orcamentoService.listarOrcamentos(status);
      setOrcamentos(Array.isArray(data) ? data : data.quotations || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os orçamentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadOrcamentos(filtroStatus === 'todos' ? null : filtroStatus);
    setIsRefreshing(false);
  }, [filtroStatus, loadOrcamentos]);

  useFocusEffect(
    useCallback(() => {
      loadOrcamentos(filtroStatus === 'todos' ? null : filtroStatus);
    }, [filtroStatus, loadOrcamentos])
  );

  const handleCancelar = (id) => {
    Alert.alert(
      'Cancelar orçamento',
      'Tem certeza que deseja cancelar este orçamento?',
      [
        { text: 'Não', onPress: () => {} },
        {
          text: 'Sim, cancelar',
          onPress: async () => {
            try {
              await orcamentoService.cancelarOrcamento(id);
              Alert.alert('Sucesso', 'Orçamento cancelado com sucesso');
              handleRefresh();
            } catch (error) {
              Alert.alert('Erro', error.message || 'Erro ao cancelar orçamento');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    return statusConfig[status]?.color || '#9CA3AF';
  };

  const getStatusLabel = (status) => {
    return statusConfig[status]?.label || status;
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  const podesCancelar = (status) => {
    return ['aguardando', 'em_analise'].includes(status);
  };

  const filteredOrcamentos = orcamentos.filter((orcamento) => {
    if (filtroStatus === 'todos') return true;
    return orcamento.status === filtroStatus;
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão de nova solicitação */}
      <TouchableOpacity
        onPress={() => navigation.navigate('SolicitarOrcamento')}
        style={styles.novaOrcamentoButton}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.novaOrcamentoText}>Solicitar orçamento</Text>
      </TouchableOpacity>

      {/* Filtros de status */}
      <View style={styles.filtrosContainer}>
        {['todos', 'aguardando', 'respondido', 'cancelado'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filtroButton,
              filtroStatus === status && styles.filtroButtonActive,
            ]}
            onPress={() => setFiltroStatus(status)}
          >
            <Text
              style={[
                styles.filtroText,
                filtroStatus === status && styles.filtroTextActive,
              ]}
            >
              {status === 'todos' ? 'Todos' : getStatusLabel(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de orçamentos */}
      {filteredOrcamentos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum orçamento encontrado</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SolicitarOrcamento')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Solicitar agora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrcamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orcamentoCard}>
              <TouchableOpacity
                style={styles.orcamentoHeader}
                onPress={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <View style={styles.orcamentoInfo}>
                  <Text style={styles.orcamentoNome} numberOfLines={2}>
                    {item.nome_peca}
                  </Text>
                  <Text style={styles.orcamentoVeiculo}>{item.veiculo}</Text>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                    <Text style={styles.orcamentoData}>
                      {formatarData(item.data_criacao)}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedId === item.id && (
                <View style={styles.orcamentoDetalhes}>
                  <Text style={styles.detalheLabel}>Descrição:</Text>
                  <Text style={styles.detalheTexto}>{item.descricao}</Text>

                  {item.valor_orcado && (
                    <>
                      <Text style={styles.detalheLabel}>Valor orçado:</Text>
                      <Text style={styles.detalheValor}>
                        R$ {parseFloat(item.valor_orcado).toFixed(2)}
                      </Text>
                    </>
                  )}

                  {item.observacoes && (
                    <>
                      <Text style={styles.detalheLabel}>Observações:</Text>
                      <Text style={styles.detalheTexto}>{item.observacoes}</Text>
                    </>
                  )}

                  {podesCancelar(item.status) && (
                    <TouchableOpacity
                      style={styles.cancelarButton}
                      onPress={() => handleCancelar(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text style={styles.cancelarText}>Cancelar orçamento</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.accent]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  novaOrcamentoButton: {
    backgroundColor: theme.colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  novaOrcamentoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  filtrosContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 0,
  },
  filtroButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filtroButtonActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  filtroText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filtroTextActive: {
    color: '#fff',
  },
  orcamentoCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  orcamentoHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orcamentoInfo: {
    flex: 1,
  },
  orcamentoNome: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  orcamentoVeiculo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orcamentoData: {
    fontSize: 12,
    color: '#999',
  },
  orcamentoDetalhes: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detalheLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detalheTexto: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  detalheValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  cancelarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelarText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});