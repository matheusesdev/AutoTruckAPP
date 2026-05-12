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
import { notificacaoService } from '../services/api';
import { theme } from '../utils/theme';

export default function NotificacoesScreen({ navigation }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tipoConfig = {
    orcamento_respondido: {
      icon: 'document-text',
      color: '#F59E0B',
      titulo: 'Orçamento Respondido',
    },
    pedido_confirmado: {
      icon: 'checkmark-circle',
      color: '#10B981',
      titulo: 'Pedido Confirmado',
    },
    pedido_enviado: {
      icon: 'send',
      color: '#3B82F6',
      titulo: 'Pedido Enviado',
    },
    pedido_entregue: {
      icon: 'checkmark-done-all',
      color: '#10B981',
      titulo: 'Pedido Entregue',
    },
    pedido_cancelado: {
      icon: 'close-circle',
      color: '#EF4444',
      titulo: 'Pedido Cancelado',
    },
    sistema: {
      icon: 'information-circle',
      color: '#6B7280',
      titulo: 'Notificação do Sistema',
    },
  };

  const loadNotificacoes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificacaoService.listarNotificacoes();
      setNotificacoes(Array.isArray(data) ? data : data.notifications || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotificacoes();
    setIsRefreshing(false);
  }, [loadNotificacoes]);

  useFocusEffect(
    useCallback(() => {
      loadNotificacoes();
    }, [loadNotificacoes])
  );

  const handleMarcarComoLida = async (id, lida) => {
    if (lida) return;

    try {
      await notificacaoService.marcarComoLida(id);
      setNotificacoes(
        notificacoes.map((notif) =>
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleNotificacaoPress = (notificacao) => {
    handleMarcarComoLida(notificacao.id, notificacao.lida);

    // Navegar para a tela relevante baseado no tipo
    switch (notificacao.tipo) {
      case 'orcamento_respondido':
        navigation.navigate('Orçamentos');
        break;
      case 'pedido_confirmado':
      case 'pedido_enviado':
      case 'pedido_entregue':
      case 'pedido_cancelado':
        if (notificacao.pedido_id) {
          navigation.navigate('DetalhesPedido', { pedidoId: notificacao.pedido_id });
        } else {
          navigation.navigate('Pedidos');
        }
        break;
      default:
        break;
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    const agora = new Date();
    const diff = agora - date;

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  const getTipoConfig = (tipo) => {
    return tipoConfig[tipo] || tipoConfig.sistema;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      {notificacoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma notificação</Text>
          <Text style={styles.emptySubtext}>Você está em dia com suas notificações</Text>
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const config = getTipoConfig(item.tipo);
            return (
              <TouchableOpacity
                style={[
                  styles.notificacaoItem,
                  !item.lida && styles.notificacaoItemNaoLida,
                ]}
                onPress={() => handleNotificacaoPress(item)}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}
                >
                  <Ionicons name={config.icon} size={24} color={config.color} />
                </View>

                <View style={styles.conteudoContainer}>
                  <Text style={styles.notificacaoTitulo}>
                    {config.titulo}
                  </Text>
                  <Text
                    style={styles.notificacaoMensagem}
                    numberOfLines={2}
                  >
                    {item.mensagem}
                  </Text>
                  <Text style={styles.notificacaoData}>
                    {formatarData(item.data_criacao)}
                  </Text>
                </View>

                {!item.lida && <View style={styles.indicadorNaoLida} />}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  notificacaoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
  },
  notificacaoItemNaoLida: {
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conteudoContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificacaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  notificacaoMensagem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificacaoData: {
    fontSize: 12,
    color: '#999',
  },
  indicadorNaoLida: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});
