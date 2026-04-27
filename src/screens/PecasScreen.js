// src/screens/PecasScreen.js
// AT-11 + AT-12 + AT-16 — Catálogo de Peças com filtro, busca e suporte offline
 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '../utils/theme';
import { fetchParts, fetchVehicles } from '../services/api';
import { salvarCache, carregarCache } from '../utils/cache';
import { useConectividade } from '../hooks/useConectividade';
 
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/1B3A6B/FFFFFF?text=AutoTruck';
const CACHE_KEY = 'pecas_catalogo';
 
// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ pulseAnim }) => (
  <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
    <View style={styles.skeletonImage} />
    <View style={styles.cardBody}>
      <View style={[styles.skeletonLine, { width: '90%', marginBottom: 6 }]} />
      <View style={[styles.skeletonLine, { width: '60%', marginBottom: 12 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 20, borderRadius: 10 }]} />
    </View>
  </Animated.View>
);
 
// ─── Part Card ────────────────────────────────────────────────────────────────
const PartCard = ({ item, onPress }) => {
  const imageUri = item.foto_url || PLACEHOLDER_IMAGE;
  const formattedPrice = Number(item.preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
 
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.cardPrice}>{formattedPrice}</Text>
        <View style={[styles.badge, item.disponivel ? styles.badgeAvailable : styles.badgeUnavailable]}>
          <Text style={[styles.badgeText, item.disponivel ? styles.badgeTextAvailable : styles.badgeTextUnavailable]}>
            {item.disponivel ? 'Disponível' : 'Esgotado'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
 
// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PecasScreen({ navigation }) {
  const { temInternet } = useConectividade();
 
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheDate, setCacheDate] = useState(null);
  const [noCache, setNoCache] = useState(false);
 
  // Veículos para o seletor
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
 
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const searchTimeout = useRef(null);
 
  // Guarda o valor anterior de temInternet para detectar reconexão
  const prevTemInternet = useRef(temInternet);
 
  // Animação do skeleton
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);
 
  // Debounce da busca
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setParts([]);
      setHasNextPage(true);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);
 
  // Reconexão: atualiza automaticamente quando volta a internet
  useEffect(() => {
    if (!prevTemInternet.current && temInternet) {
      // Voltou a internet — recarrega da API
      setPage(1);
      setParts([]);
      setHasNextPage(true);
      loadParts(1, true);
    }
    prevTemInternet.current = temInternet;
  }, [temInternet]);
 
  // Carregar veículos
  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const result = await fetchVehicles();
      setVehicles(Array.isArray(result) ? result : result.data || []);
    } catch {
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };
 
  // Carregar peças — online ou do cache
  const loadParts = useCallback(async (pageNum, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    setNoCache(false);
 
    // ── SEM INTERNET ──────────────────────────────────────────────────────────
    if (!temInternet) {
      setIsOffline(true);
      const cached = await carregarCache(CACHE_KEY);
 
      if (cached) {
        setParts(cached.data || cached);
        setCacheDate(cached.savedAt || null);
        setHasNextPage(false); // cache não tem paginação
      } else {
        setParts([]);
        setNoCache(true);
      }
 
      setLoading(false);
      setLoadingMore(false);
      return;
    }
 
    // ── COM INTERNET ──────────────────────────────────────────────────────────
    setIsOffline(false);
    try {
      const result = await fetchParts({
        search: debouncedSearch,
        page: pageNum,
        limit: 20,
        veiculo_id: selectedVehicle?.id || null,
      });
 
      const newParts = reset || pageNum === 1 ? result.data : [...parts, ...result.data];
      setParts(newParts);
      setHasNextPage(result.meta.hasNextPage);
 
      // Salva no cache apenas a primeira página sem filtros (dados gerais)
      if (pageNum === 1 && !selectedVehicle && !debouncedSearch) {
        await salvarCache(CACHE_KEY, {
          data: result.data,
          savedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Falha na API — tenta o cache como fallback
      const cached = await carregarCache(CACHE_KEY);
      if (cached) {
        setParts(cached.data || cached);
        setCacheDate(cached.savedAt || null);
        setIsOffline(true);
        setHasNextPage(false);
      } else {
        setError('Erro ao carregar peças. Tente novamente.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedVehicle, temInternet]);
 
  useEffect(() => {
    loadParts(1, true);
  }, [loadParts]);
 
  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage && !loading && !isOffline) {
      const next = page + 1;
      setPage(next);
      loadParts(next);
    }
  };
 
  const handleCardPress = (item) => {
    navigation.navigate('DetalhePeca', { partId: item.id });
  };
 
  const handleOpenVehicleModal = () => {
    loadVehicles();
    setShowVehicleModal(true);
  };
 
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(false);
    setPage(1);
    setParts([]);
    setHasNextPage(true);
  };
 
  const handleClearVehicle = () => {
    setSelectedVehicle(null);
    setPage(1);
    setParts([]);
    setHasNextPage(true);
  };
 
  // Formata a data do cache em pt-BR
  const formatCacheDate = (isoDate) => {
    if (!isoDate) return 'data desconhecida';
    try {
      return new Date(isoDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'data desconhecida';
    }
  };
 
  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.ano}`
    : 'Todos os veículos';
 
  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color={theme.colors.accent} size="small" />
        <Text style={styles.loadingText}>Carregando mais peças...</Text>
      </View>
    );
  };
 
  const renderEmpty = () => {
    // Sem cache e sem internet
    if (noCache) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>Sem conexão</Text>
          <Text style={styles.emptySubtitle}>
            Conecte à internet para ver o catálogo.
          </Text>
        </View>
      );
    }
 
    // Filtro de veículo sem resultados
    if (selectedVehicle) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>
            Nenhuma peça compatível com{'\n'}
            {selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.ano}
          </Text>
          <TouchableOpacity
            style={styles.orcamentoButton}
            onPress={() => navigation.navigate('SolicitarOrcamento')}
          >
            <Text style={styles.orcamentoButtonText}>Solicitar orçamento para esta peça</Text>
          </TouchableOpacity>
        </View>
      );
    }
 
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔩</Text>
        <Text style={styles.emptyTitle}>Nenhuma peça encontrada</Text>
        <Text style={styles.emptySubtitle}>Tente buscar por outro termo.</Text>
      </View>
    );
  };
 
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Peças</Text>
      </View>
 
      {/* Banner offline */}
      {isOffline && !noCache && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⚠️ Exibindo peças salvas · Última atualização: {formatCacheDate(cacheDate)}
          </Text>
        </View>
      )}
 
      {/* Busca — só exibe com internet */}
      {!isOffline && (
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar peça..."
              placeholderTextColor={theme.colors.disabledText}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {debouncedSearch.length > 0 && (
            <Text style={styles.searchingText}>
              Buscando por '{debouncedSearch}'...
            </Text>
          )}
        </View>
      )}
 
      {/* Seletor de veículo — só exibe com internet */}
      {!isOffline && (
        <TouchableOpacity style={styles.vehicleSelector} onPress={handleOpenVehicleModal} activeOpacity={0.8}>
          <Text style={styles.vehicleSelectorIcon}>🚛</Text>
          <Text style={[styles.vehicleSelectorText, selectedVehicle && styles.vehicleSelectorTextActive]}>
            {vehicleLabel}
          </Text>
          <Text style={styles.vehicleSelectorArrow}>▾</Text>
        </TouchableOpacity>
      )}
 
      {/* Banner veículo selecionado */}
      {selectedVehicle && !isOffline && (
        <View style={styles.vehicleBanner}>
          <Text style={styles.vehicleBannerText}>
            🔧 Peças para {selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.ano}
          </Text>
          <TouchableOpacity onPress={handleClearVehicle}>
            <Text style={styles.vehicleBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {/* Erro */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadParts(1, true)}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {/* Skeleton */}
      {loading && !error && (
        <View style={styles.grid}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} pulseAnim={pulseAnim} />
          ))}
        </View>
      )}
 
      {/* Lista */}
      {!loading && !error && (
        <FlatList
          data={parts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PartCard item={item} onPress={handleCardPress} />}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
 
      {/* Modal seletor de veículo */}
      <Modal
        visible={showVehicleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVehicleModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
 
            {loadingVehicles ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.modalLoadingText}>Carregando veículos...</Text>
              </View>
            ) : (
              <ScrollView>
                <TouchableOpacity
                  style={[styles.vehicleOption, !selectedVehicle && styles.vehicleOptionSelected]}
                  onPress={() => handleSelectVehicle(null)}
                >
                  <Text style={[styles.vehicleOptionText, !selectedVehicle && styles.vehicleOptionTextSelected]}>
                    Todos os veículos
                  </Text>
                  {!selectedVehicle && <Text style={styles.vehicleOptionCheck}>✓</Text>}
                </TouchableOpacity>
 
                {vehicles.length === 0 && (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>Nenhum veículo cadastrado.</Text>
                    <Text style={styles.modalEmptySubtext}>Cadastre um veículo na aba Veículos.</Text>
                  </View>
                )}
 
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vehicleOption, selectedVehicle?.id === v.id && styles.vehicleOptionSelected]}
                    onPress={() => handleSelectVehicle(v)}
                  >
                    <View>
                      <Text style={[styles.vehicleOptionText, selectedVehicle?.id === v.id && styles.vehicleOptionTextSelected]}>
                        {v.marca} {v.modelo} {v.ano}
                      </Text>
                      <Text style={styles.vehicleOptionPlate}>{v.placa}</Text>
                    </View>
                    {selectedVehicle?.id === v.id && (
                      <Text style={styles.vehicleOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
 
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
 
  // Banner offline
  offlineBanner: {
    backgroundColor: '#FEF9C3',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
 
  // Busca
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    padding: 0,
  },
  clearIcon: {
    fontSize: 13,
    color: theme.colors.disabledText,
    paddingLeft: 8,
  },
  searchingText: {
    fontSize: 12,
    color: theme.colors.disabledText,
    marginTop: 6,
    fontStyle: 'italic',
  },
 
  // Seletor de veículo
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.inputBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  vehicleSelectorIcon: { fontSize: 16 },
  vehicleSelectorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.disabledText,
  },
  vehicleSelectorTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  vehicleSelectorArrow: {
    fontSize: 12,
    color: theme.colors.disabledText,
  },
 
  // Banner veículo selecionado
  vehicleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  vehicleBannerText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
    flex: 1,
  },
  vehicleBannerClose: {
    fontSize: 13,
    color: '#1D4ED8',
    paddingLeft: 12,
    fontWeight: '700',
  },
 
  // Grid skeleton
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
 
  // Lista
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
 
  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 110,
    backgroundColor: theme.colors.inputBackground,
  },
  cardBody: { padding: 10 },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.accent,
    marginBottom: 8,
  },
 
  // Badge
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeAvailable: { backgroundColor: '#DCFCE7' },
  badgeUnavailable: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextAvailable: { color: '#16A34A' },
  badgeTextUnavailable: { color: theme.colors.error },
 
  // Skeleton
  skeletonImage: {
    width: '100%',
    height: 110,
    backgroundColor: theme.colors.border,
  },
  skeletonLine: {
    height: 13,
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    marginBottom: 8,
  },
 
  // Footer loader
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: theme.colors.disabledText,
    fontSize: 13,
  },
 
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.disabledText,
    textAlign: 'center',
  },
  orcamentoButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  orcamentoButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
 
  // Erro
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
 
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: 16,
    color: theme.colors.disabledText,
    padding: 4,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  modalLoadingText: {
    color: theme.colors.disabledText,
    fontSize: 14,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  modalEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  modalEmptySubtext: {
    fontSize: 13,
    color: theme.colors.disabledText,
    textAlign: 'center',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  vehicleOptionSelected: { backgroundColor: '#EFF6FF' },
  vehicleOptionText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  vehicleOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  vehicleOptionPlate: {
    fontSize: 12,
    color: theme.colors.disabledText,
    marginTop: 2,
  },
  vehicleOptionCheck: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});