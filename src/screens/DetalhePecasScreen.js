import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { theme } from '../utils/theme';
import { fetchPartById } from '../services/api';
 
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 250;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x500/1B3A6B/FFFFFF?text=AutoTruck';
 
// ─── Chip de compatibilidade ──────────────────────────────────────────────────
const CompatibilityChip = ({ item }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>
      {item.marca} {item.modelo} ({item.ano_inicio} – {item.ano_fim})
    </Text>
  </View>
);
 
// ─── Cabeçalho de seção ───────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);
 
// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DetalhePecaScreen({ route, navigation }) {
  const { partId } = route.params;
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const scrollY = useRef(new Animated.Value(0)).current;
 
  const backOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });
 
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPartById(partId);
        setPart(result.data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar peça.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [partId]);
 
  const handleSolicitarOrcamento = () => {
    Alert.alert(
      'Solicitar Orçamento',
      `Deseja solicitar um orçamento para:\n"${part?.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => Alert.alert('✅ Solicitação enviada!', 'Em breve entraremos em contato.'),
        },
      ]
    );
  };
 
  const handleComprar = () => {
    Alert.alert('Em breve', 'A funcionalidade de compra estará disponível em breve.');
  };
 
  // Loading
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando peça...</Text>
      </View>
    );
  }
 
  // Erro
  if (error || !part) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Algo deu errado</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.backButtonFallback} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonFallbackText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  const formattedPrice = Number(part.preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
 
  return (
    <View style={styles.container}>
      {/* Conteúdo rolável */}
      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Foto hero */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: part.foto_url || PLACEHOLDER_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient} />
        </View>
 
        {/* Card de conteúdo */}
        <View style={styles.contentCard}>
          {/* Nome */}
          <Text style={styles.partName}>{part.nome}</Text>
 
          {/* Preço + badge estoque */}
          <View style={styles.priceRow}>
            <Text style={styles.partPrice}>{formattedPrice}</Text>
            <View style={[styles.stockBadge, part.disponivel ? styles.stockAvailable : styles.stockUnavailable]}>
              <Text style={[styles.stockText, part.disponivel ? styles.stockTextAvailable : styles.stockTextUnavailable]}>
                {part.disponivel ? `${part.estoque} em estoque` : 'Esgotado'}
              </Text>
            </View>
          </View>
 
          <View style={styles.divider} />
 
          {/* Descrição */}
          <SectionHeader title="Descrição" />
          <Text style={styles.descriptionText}>{part.descricao}</Text>
 
          <View style={styles.divider} />
 
          {/* Compatibilidade */}
          <SectionHeader title="Compatível com" />
          <View style={styles.chipsContainer}>
            {part.compatibilidade.map((comp, index) => (
              <CompatibilityChip key={index} item={comp} />
            ))}
          </View>
 
          {/* Espaço para o footer fixo */}
          <View style={{ height: part.disponivel ? 110 : 80 }} />
        </View>
      </Animated.ScrollView>
 
      {/* Botão voltar flutuante */}
      <Animated.View style={[styles.floatingBack, { opacity: backOpacity }]}>
        <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.floatingBackIcon}>←</Text>
        </TouchableOpacity>
      </Animated.View>
 
      {/* Footer fixo */}
      <View style={styles.footer}>
        {part.disponivel && (
          <TouchableOpacity style={styles.btnComprar} onPress={handleComprar} activeOpacity={0.8}>
            <Text style={styles.btnComprarText}>Comprar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnOrcamento, !part.disponivel && { flex: 1 }]}
          onPress={handleSolicitarOrcamento}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOrcamentoText}>📋 Solicitar Orçamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
 
  // Estados centralizados
  centeredContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: theme.colors.disabledText,
    marginTop: 16,
    fontSize: 15,
  },
  errorIcon: { fontSize: 44, marginBottom: 12 },
  errorTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonFallback: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonFallbackText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
 
  scroll: { flex: 1 },
 
  // Hero
  heroContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
 
  // Botão voltar flutuante
  floatingBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    zIndex: 10,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27, 58, 107, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBackIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 22,
  },
 
  // Card de conteúdo
  contentCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  partName: {
    fontSize: 21,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  partPrice: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.accent,
  },
 
  // Badge estoque
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stockAvailable: { backgroundColor: '#DCFCE7' },
  stockUnavailable: { backgroundColor: '#FEE2E2' },
  stockText: { fontSize: 12, fontWeight: '700' },
  stockTextAvailable: { color: '#16A34A' },
  stockTextUnavailable: { color: theme.colors.error },
 
  // Divisor
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 20,
  },
 
  // Seção
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
 
  // Descrição
  descriptionText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
  },
 
  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
 
  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 10,
  },
  btnComprar: {
    flex: 1,
    backgroundColor: theme.colors.disabled,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnComprarText: {
    color: theme.colors.disabledText,
    fontWeight: '700',
    fontSize: 15,
  },
  btnOrcamento: {
    flex: 2,
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnOrcamentoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});