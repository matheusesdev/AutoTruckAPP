import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { pedidoService } from '../services/api';
import { theme } from '../utils/theme';

export default function PedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusConfig = {
    pendente: { color: '#9CA3AF', label: 'Pendente', icon: 'hourglass' },
    processando: { color: '#F59E0B', label: 'Processando', icon: 'cube' },
    enviado: { color: '#3B82F6', label: 'Enviado', icon: 'send' },
    entregue: { color: '#10B981', label: 'Entregue', icon: 'checkmark-done' },
    cancelado: { color: '#EF4444', label: 'Cancelado', icon: 'close-circle' },
  };

  const loadPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await pedidoService.listarPedidos();
      setPedidos(Array.isArray(data) ? data : data?.orders || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPedidos();
    setIsRefreshing(false);
  }, [loadPedidos]);

  useFocusEffect(
    useCallback(() => {
      loadPedidos();
    }, [loadPedidos])
  );

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.pendente;
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2)}`;
  };

  const safePedidos = Array.isArray(pedidos) ? pedidos : [];

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Pedidos</Text>

      {safePedidos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum pedido realizado</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Peças')}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Ver catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={safePedidos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const statusInfo = getStatusConfig(item.status);
            return (
              <TouchableOpacity
                style={styles.pedidoCard}
                onPress={() =>
                  navigation.navigate('DetalhesPedido', { pedidoId: item.id })
                }
              >
                <View style={styles.pedidoHeader}>
                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoNumero}>
                      Pedido #{item.numero_pedido}
                    </Text>
                    <Text style={styles.pedidoData}>
                      {formatarData(item.data_pedido)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.color },
                    ]}
                  >
                    <Ionicons
                      name={statusInfo.icon}
                      size={14}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.pedidoFooter}>
                  <Text style={styles.pedidoValor}>
                    {formatarValor(item.valor_total)}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabel}>
                      <Text style={styles.progressText}>
                        {item.itens_quantidade} item
                        {item.itens_quantidade !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#999"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: theme.colors.text,
  },
  pedidoCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pedidoHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  pedidoData: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pedidoFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  pedidoValor: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
