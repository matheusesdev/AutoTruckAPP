import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useNotificacaoStore from '../store/notificacaoStore';

const NotificacaoItem = ({ notificacao, onRemove }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notificacao.id);
    }, notificacao.duracao || 3000);

    return () => clearTimeout(timer);
  }, [notificacao, onRemove]);

  const getIconAndColor = (tipo) => {
    switch (tipo) {
      case 'sucesso':
        return { icon: 'checkmark-circle', color: '#10B981', bgColor: '#ECFDF5' };
      case 'erro':
        return { icon: 'close-circle', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'aviso':
        return { icon: 'alert-circle', color: '#F59E0B', bgColor: '#FFFBEB' };
      default:
        return { icon: 'information-circle', color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor(notificacao.tipo);

  return (
    <View style={styles.notificacaoContainer}>
      <View style={[styles.notificacao, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} style={styles.icon} />
        <Text style={[styles.mensagem, { color: '#1F2937' }]} numberOfLines={2}>
          {notificacao.mensagem}
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(notificacao.id)}
        >
          <Ionicons name="close" size={20} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function NotificacaoContainer() {
  const notificacoes = useNotificacaoStore((state) => state.notificacoes);
  const removerNotificacao = useNotificacaoStore((state) => state.removerNotificacao);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notificacoes.map((notificacao) => (
        <NotificacaoItem
          key={notificacao.id}
          notificacao={notificacao}
          onRemove={removerNotificacao}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  notificacaoContainer: {
    marginBottom: 8,
  },
  notificacao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 12,
    minWidth: 20,
  },
  mensagem: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
