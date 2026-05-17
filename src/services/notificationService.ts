import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// ============================================
// TIPOS
// ============================================

export interface PushNotification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'servico' | 'pedido' | 'orcamento' | 'sistema';
  status?: string;
  servicoId?: number;
  pedidoId?: number;
  orcamentoId?: number;
  lida: boolean;
  data_criacao: string;
  data_leitura?: string;
  dados?: Record<string, any>;
}

// ============================================
// CONFIGURAÇÃO DE NOTIFICAÇÕES
// ============================================

/**
 * Configura o comportamento padrão de notificações
 */
export const configurarNotificacoes = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// ============================================
// REGISTRO DE DISPOSITIVO
// ============================================

/**
 * Obter token de push do dispositivo
 */
export const obterTokenPush = async (): Promise<string | null> => {
  try {
    // Verificar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Obter token
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      console.warn('EXPO_PUBLIC_PROJECT_ID não definido');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Erro ao obter token de push:', error);
    return null;
  }
};

/**
 * Registrar token de push no backend
 */
export const registrarTokenNoBackend = async (token: string): Promise<void> => {
  try {
    await api.post('/notifications/register-device', {
      expo_push_token: token,
      platform: 'ios', // Será substituído em runtime se necessário
    });
    console.log('Token de push registrado no backend');
  } catch (error) {
    console.error('Erro ao registrar token no backend:', error);
  }
};

/**
 * Atualizar token de push
 */
export const atualizarTokenPush = async (): Promise<string | null> => {
  try {
    const novoToken = await obterTokenPush();

    if (!novoToken) {
      return null;
    }

    const tokenAnterior = await AsyncStorage.getItem('@expo_push_token');

    if (tokenAnterior !== novoToken) {
      await registrarTokenNoBackend(novoToken);
      await AsyncStorage.setItem('@expo_push_token', novoToken);
      console.log('Token de push atualizado:', novoToken);
    }

    return novoToken;
  } catch (error) {
    console.error('Erro ao atualizar token de push:', error);
    return null;
  }
};

// ============================================
// GERENCIAMENTO DE HISTÓRICO
// ============================================

const STORAGE_KEY = '@notificacoes_historico';

/**
 * Salvar notificação no histórico local
 */
export const salvarNotificacao = async (notificacao: PushNotification): Promise<void> => {
  try {
    const historico = await carregarNotificacoes();
    const novaLista = [notificacao, ...historico];
    // Manter apenas últimas 100 notificações
    const limitado = novaLista.slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitado));
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
  }
};

/**
 * Carregar notificações do histórico local
 */
export const carregarNotificacoes = async (): Promise<PushNotification[]> => {
  try {
    const dados = await AsyncStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    return [];
  }
};

/**
 * Marcar notificação como lida
 */
export const marcarComoLida = async (notificacaoId: string): Promise<void> => {
  try {
    const notificacoes = await carregarNotificacoes();
    const atualizada = notificacoes.map((n) =>
      n.id === notificacaoId
        ? {
            ...n,
            lida: true,
            data_leitura: new Date().toISOString(),
          }
        : n
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));

    // Sincronizar com backend (não bloqueia)
    api
      .patch(`/notifications/${notificacaoId}/read`)
      .catch((err: any) =>
        console.warn('Aviso: notificação não marcada como lida no servidor:', err)
      );
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

/**
 * Obter notificações não lidas
 */
export const obterNaoLidas = async (): Promise<PushNotification[]> => {
  try {
    const notificacoes = await carregarNotificacoes();
    return notificacoes.filter((n) => !n.lida);
  } catch (error) {
    console.error('Erro ao obter notificações não lidas:', error);
    return [];
  }
};

/**
 * Obter contagem de não lidas
 */
export const obterContagemNaoLidas = async (): Promise<number> => {
  const naoLidas = await obterNaoLidas();
  return naoLidas.length;
};

/**
 * Limpar histórico de notificações
 */
export const limparHistorico = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
  }
};

/**
 * Limpar notificações lidas
 */
export const limparLidas = async (): Promise<void> => {
  try {
    const notificacoes = await carregarNotificacoes();
    const naoLidas = notificacoes.filter((n) => !n.lida);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(naoLidas));
  } catch (error) {
    console.error('Erro ao limpar notificações lidas:', error);
  }
};

// ============================================
// LISTENERS
// ============================================

/**
 * Configurar listeners para notificações recebidas
 */
export const configurarListenerNotificacoesRecebidas = (
  callback: (notificacao: PushNotification) => void
): (() => void) => {
  const subscription = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const { data } = notification.request.content;

      const notificacao: PushNotification = {
        id: notification.request.identifier,
        titulo: notification.request.content.title || 'Notificação',
        mensagem: notification.request.content.body || '',
        tipo: data?.tipo || 'sistema',
        status: data?.status,
        servicoId: data?.servico_id,
        pedidoId: data?.pedido_id,
        orcamentoId: data?.orcamento_id,
        lida: false,
        data_criacao: new Date().toISOString(),
        dados: data,
      };

      await salvarNotificacao(notificacao);
      callback(notificacao);
    }
  );

  return () => subscription.remove();
};

/**
 * Configurar listeners para notificações tocadas pelo usuário
 */
export const configurarListenerNotificacoesTocadas = (
  callback: (notificacao: Notifications.NotificationResponse) => void
): (() => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
};

// ============================================
// TESTE DE NOTIFICAÇÕES (DEV)
// ============================================

/**
 * Enviar notificação de teste local (desenvolvimento)
 */
export const enviarNotificacaoTeste = async (
  titulo: string = 'Teste de Notificação',
  mensagem: string = 'Esta é uma notificação de teste'
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensagem,
        data: { tipo: 'teste' },
      },
      trigger: null, // Imediato
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
  }
};

// ============================================
// HELPER PARA EXTRAIR INFORMAÇÕES
// ============================================

/**
 * Obter ícone e cor baseado no tipo de notificação
 */
export const obterEstiloNotificacao = (tipo: string, status?: string) => {
  const estilos: Record<string, any> = {
    servico: {
      icon: 'construct',
      color: '#E87722',
      titulo: 'Serviço',
    },
    pedido: {
      icon: 'cart',
      color: '#3B82F6',
      titulo: 'Pedido',
    },
    orcamento: {
      icon: 'document-text',
      color: '#F59E0B',
      titulo: 'Orçamento',
    },
    sistema: {
      icon: 'information-circle',
      color: '#6B7280',
      titulo: 'Sistema',
    },
  };

  const statusEstilos: Record<string, string> = {
    agendado: '#3B82F6',
    'em análise': '#F59E0B',
    'em manutenção': '#FBBF24',
    finalizado: '#10B981',
    cancelado: '#EF4444',
    confirmado: '#10B981',
    enviado: '#3B82F6',
    entregue: '#10B981',
    respondido: '#10B981',
  };

  const estilo = estilos[tipo] || estilos.sistema;

  return {
    ...estilo,
    statusColor: status ? (statusEstilos[status.toLowerCase()] || estilo.color) : estilo.color,
  };
};

/**
 * Formatar data para exibição
 */
export const formatarDataNotificacao = (data: string): string => {
  const dataObj = new Date(data);
  const agora = new Date();
  const diferenca = agora.getTime() - dataObj.getTime();
  const minutos = Math.floor(diferenca / (1000 * 60));
  const horas = Math.floor(diferenca / (1000 * 60 * 60));
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `${minutos}m atrás`;
  if (horas < 24) return `${horas}h atrás`;
  if (dias < 7) return `${dias}d atrás`;

  return dataObj.toLocaleDateString('pt-BR');
};
