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
} from 'react-native';
import { theme } from '../utils/theme';
import { fetchParts } from '../services/api';
 
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/1B3A6B/FFFFFF?text=AutoTruck';
 
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
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
 
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const searchTimeout = useRef(null);
 
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
 
  const loadParts = useCallback(async (pageNum, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
 
    try {
      const result = await fetchParts({ search: debouncedSearch, page: pageNum, limit: 20 });
      setParts(prev => (reset || pageNum === 1 ? result.data : [...prev, ...result.data]));
      setHasNextPage(result.meta.hasNextPage);
    } catch (err) {
      setError('Erro ao carregar peças. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch]);
 
  useEffect(() => {
    loadParts(1, true);
  }, [loadParts]);
 
  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage && !loading) {
      const next = page + 1;
      setPage(next);
      loadParts(next);
    }
  };
 
  const handleCardPress = (item) => {
    navigation.navigate('DetalhePeca', { partId: item.id });
  };
 
  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color={theme.colors.accent} size="small" />
        <Text style={styles.loadingText}>Carregando mais peças...</Text>
      </View>
    );
  };
 
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔩</Text>
      <Text style={styles.emptyTitle}>Nenhuma peça encontrada</Text>
      <Text style={styles.emptySubtitle}>Tente buscar por outro termo.</Text>
    </View>
  );
 
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo de Peças</Text>
      </View>
 
      {/* Busca */}
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
      </View>
 
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
 
  // Busca
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.disabledText,
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
});