import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pedidoService } from '../services/api';
import { theme } from '../utils/theme';

export default function DetalhesPedidoScreen({ route, navigation }) {
  const { pedidoId } = route.params || {};
  const [pedido, setPedido] = useState(null);
  const [rastreamento, setRastreamento] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rastreamento'); // 'rastreamento' ou 'detalhes'

  useEffect(() => {
    loadDetalhes();
  }, [pedidoId]);

  const loadDetalhes = async () => {
    if (!pedidoId) return;

    try {
      setIsLoading(true);
      
      // Carregar detalhes do pedido
      const pedidoData = await pedidoService.obterPedido(pedidoId);
      setPedido(pedidoData.order || pedidoData);

      // Carregar rastreamento
      const rastreamentoData = await pedidoService.rastrearPedido(pedidoId);
      setRastreamento(rastreamentoData.tracking || rastreamentoData);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
  };

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2)}`;
  };

  const statusConfig = {
    pendente: { color: '#9CA3AF', label: 'Pendente' },
    processando: { color: '#F59E0B', label: 'Processando' },
    enviado: { color: '#3B82F6', label: 'Enviado' },
    entregue: { color: '#10B981', label: 'Entregue' },
    cancelado: { color: '#EF4444', label: 'Cancelado' },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.errorText}>Pedido não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = statusConfig[pedido.status] || statusConfig.pendente;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{pedido.numero_pedido}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Summary */}
      <View style={styles.statusSummary}>
        <View
          style={[styles.statusBadgeLarge, { backgroundColor: statusInfo.color }]}
        >
          <Ionicons name="cube" size={24} color="#fff" />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>{statusInfo.label}</Text>
          <Text style={styles.statusDate}>
            Pedido em {formatarData(pedido.data_pedido)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rastreamento' && styles.tabActive]}
          onPress={() => setActiveTab('rastreamento')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'rastreamento' && styles.tabTextActive,
            ]}
          >
            Rastreamento
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'detalhes' && styles.tabActive]}
          onPress={() => setActiveTab('detalhes')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'detalhes' && styles.tabTextActive,
            ]}
          >
            Detalhes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'rastreamento' ? (
          <View>
            {rastreamento && rastreamento.eventos && rastreamento.eventos.length > 0 ? (
              <View style={styles.timelineContainer}>
                {rastreamento.eventos.map((evento, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineBullet}>
                      <View
                        style={[
                          styles.timelineBulletInner,
                          { backgroundColor: evento.completo ? theme.colors.accent : '#D1D5DB' },
                        ]}
                      />
                    </View>

                    {index < rastreamento.eventos.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: evento.completo ? theme.colors.accent : '#D1D5DB' },
                        ]}
                      />
                    )}

                    <View style={styles.timelineContent}>
                      <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
                      <Text style={styles.eventoDescricao}>{evento.descricao}</Text>
                      {evento.data && (
                        <Text style={styles.eventoData}>
                          {formatarDataHora(evento.data)}
                        </Text>
                      )}
                      {evento.localizacao && (
                        <View style={styles.localizacaoContainer}>
                          <Ionicons name="location" size={14} color="#666" />
                          <Text style={styles.localizacao}>{evento.localizacao}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  Rastreamento ainda não disponível
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Informações de entrega */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionLabel}>Rua/Avenida:</Text>
                <Text style={styles.sectionValue}>
                  {pedido.endereco_entrega || 'Não informado'}
                </Text>

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                  Cidade:
                </Text>
                <Text style={styles.sectionValue}>
                  {pedido.cidade || 'Não informado'}
                </Text>

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                  CEP:
                </Text>
                <Text style={styles.sectionValue}>
                  {pedido.cep || 'Não informado'}
                </Text>
              </View>
            </View>

            {/* Itens do pedido */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Itens do Pedido</Text>
              {pedido.itens && pedido.itens.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNome}>{item.nome}</Text>
                    <Text style={styles.itemQuantidade}>
                      Quantidade: {item.quantidade}
                    </Text>
                  </View>
                  <Text style={styles.itemValor}>
                    {formatarValor(item.valor_unitario)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Resumo financeiro */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
              <View style={styles.resumoContainer}>
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>Subtotal:</Text>
                  <Text style={styles.resumoValue}>
                    {formatarValor(pedido.valor_subtotal || 0)}
                  </Text>
                </View>
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>Frete:</Text>
                  <Text style={styles.resumoValue}>
                    {formatarValor(pedido.valor_frete || 0)}
                  </Text>
                </View>
                <View style={styles.resumoDivisor} />
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabelTotal}>Total:</Text>
                  <Text style={styles.resumoValueTotal}>
                    {formatarValor(pedido.valor_total)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Datas importantes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datas Importantes</Text>
              <View style={styles.datesContainer}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Pedido realizado:</Text>
                  <Text style={styles.dateValue}>
                    {formatarDataHora(pedido.data_pedido)}
                  </Text>
                </View>
                {pedido.data_entrega_estimada && (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Entrega estimada:</Text>
                    <Text style={styles.dateValue}>
                      {formatarData(pedido.data_entrega_estimada)}
                    </Text>
                  </View>
                )}
                {pedido.data_entrega && (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Entregue em:</Text>
                    <Text style={styles.dateValue}>
                      {formatarDataHora(pedido.data_entrega)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 13,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: theme.colors.accent,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timelineContainer: {
    marginTop: 12,
  },
  timelineItem: {
    marginBottom: 24,
    position: 'relative',
  },
  timelineBullet: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineBulletInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 60,
  },
  timelineContent: {
    marginLeft: 36,
    paddingBottom: 12,
  },
  eventoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  eventoDescricao: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  eventoData: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  localizacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  localizacao: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sectionValue: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemQuantidade: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemValor: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  resumoContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 13,
    color: '#666',
  },
  resumoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  resumoDivisor: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  resumoLabelTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  resumoValueTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  datesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  dateItem: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    color: theme.colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
