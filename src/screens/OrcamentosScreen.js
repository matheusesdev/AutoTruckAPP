import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import SkeletonBox from '../components/SkeletonBox';
import { useOrcamentos } from '../hooks/useOrcamentos';
import { theme } from '../utils/theme';

const TAB_OPTIONS = ['Ativos', 'Historico'];

const STATUS_VARIANTS = {
  aguardando: {
    label: 'Aguardando',
    icon: 'time-outline',
    backgroundColor: '#2A2000',
    textColor: '#FFD60A',
  },
  em_analise: {
    label: 'Em analise',
    icon: 'search-outline',
    backgroundColor: '#0D1F3C',
    textColor: '#7FA8D8',
  },
  respondido: {
    label: 'Respondido',
    icon: 'checkmark-circle-outline',
    backgroundColor: '#0D3320',
    textColor: '#30D158',
  },
};

export default function OrcamentosScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Ativos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { orcamentos, isLoading, error, refresh } = useOrcamentos();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const ativos = useMemo(
    () => orcamentos.filter((item) => item.status !== 'respondido'),
    [orcamentos]
  );

  const historico = useMemo(
    () => orcamentos.filter((item) => item.status === 'respondido'),
    [orcamentos]
  );

  const visibleOrcamentos = activeTab === 'Ativos' ? ativos : historico;

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status) => {
    return STATUS_VARIANTS[status] || {
      label: status || 'Indefinido',
      icon: 'help-circle-outline',
      backgroundColor: '#2E2E2E',
      textColor: '#CBD5E1',
    };
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleViewDetails = useCallback(() => {
    Alert.alert('Em breve', 'Detalhes do orcamento ainda nao estao disponiveis.');
  }, []);

  const renderTabButton = (tab) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setActiveTab(tab)}
        style={[styles.tabButton, isActive ? styles.tabButtonActive : styles.tabButtonInactive]}
      >
        <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStatusBadge = (status) => {
    const variant = getStatusVariant(status);
    const badgeStyle =
      status === 'aguardando'
        ? styles.statusBadgeAguardando
        : status === 'em_analise'
        ? styles.statusBadgeEmAnalise
        : status === 'respondido'
        ? styles.statusBadgeRespondido
        : styles.statusBadgeDefault;

    const labelStyle =
      status === 'aguardando'
        ? styles.statusLabelAguardando
        : status === 'em_analise'
        ? styles.statusLabelEmAnalise
        : status === 'respondido'
        ? styles.statusLabelRespondido
        : styles.statusLabelDefault;

    return (
      <View style={[styles.statusBadge, badgeStyle]}> 
        <Ionicons name={variant.icon} size={12} color={variant.textColor} style={styles.statusIcon} />
        <Text style={[styles.statusLabel, labelStyle]}>{variant.label}</Text>
      </View>
    );
  };

  const renderOrcamento = ({ item }) => (
    <View style={styles.card}> 
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.descricao || item.nome_peca || 'Orcamento sem descricao'}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.data_criacao || item.created_at)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.vehicleText}>{item.veiculo || 'Veiculo nao informado'}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={handleViewDetails} style={styles.detailsButton}>
          <Text style={styles.detailsText}>{'Ver detalhes ->'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.listContent}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.card}>
          <View style={styles.skeletonGroup}>
            <SkeletonBox width="100%" height={20} style={styles.skeletonGap} />
            <SkeletonBox width="60%" height={14} style={styles.skeletonGap} />
          </View>
          <View style={styles.divider} />
          <View style={[styles.cardBody, styles.skeletonBody]}>
            <SkeletonBox width="40%" height={14} style={styles.skeletonGap} />
            <SkeletonBox width="25%" height={18} style={styles.skeletonGap} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    const emptyProps =
      activeTab === 'Ativos'
        ? { icon: 'document-text-outline', title: 'Nenhum orcamento ativo' }
        : { icon: 'archive-outline', title: 'Historico vazio' };

    return <EmptyState {...emptyProps} />;
  };

  if (isLoading && !isRefreshing) {
    return <View style={styles.loadingContainer}>{renderLoadingSkeleton()}</View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>{TAB_OPTIONS.map(renderTabButton)}</View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {visibleOrcamentos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={visibleOrcamentos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderOrcamento}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[theme.colors.accent]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabLabelInactive: {
    color: theme.colors.disabledText,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadow.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardTitle: {
    flex: 1,
    ...theme.typography.body,
    fontWeight: '600',
    color: '#fff',
  },
  cardDate: {
    ...theme.typography.caption,
    color: theme.colors.disabledText,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#40444A',
    marginHorizontal: 16,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  vehicleText: {
    ...theme.typography.bodySmall,
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
  },
  statusBadgeAguardando: {
    backgroundColor: '#2A2000',
  },
  statusBadgeEmAnalise: {
    backgroundColor: '#0D1F3C',
  },
  statusBadgeRespondido: {
    backgroundColor: '#0D3320',
  },
  statusBadgeDefault: {
    backgroundColor: '#2E2E2E',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  statusLabelAguardando: {
    color: '#FFD60A',
  },
  statusLabelEmAnalise: {
    color: '#7FA8D8',
  },
  statusLabelRespondido: {
    color: '#30D158',
  },
  statusLabelDefault: {
    color: '#CBD5E1',
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#40444A',
    padding: 16,
    alignItems: 'flex-end',
  },
  detailsButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  detailsText: {
    ...theme.typography.label,
    color: '#FF9500',
  },
  skeletonGroup: {
    padding: 16,
  },
  skeletonGap: {
    marginBottom: 12,
  },
  skeletonBody: {
    justifyContent: 'space-between',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.body,
    textAlign: 'center',
  },
});
