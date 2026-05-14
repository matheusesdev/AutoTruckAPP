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
  FlatList,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { fetchPartById } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 280;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x500/1B3A6B/FFFFFF?text=AutoTruck';

const RELATED_PARTS = [
  {
    id: 'rel-1',
    nome: 'Filtro de óleo XLS',
    preco: '89.90',
    foto: 'https://via.placeholder.com/120x90/3A4A89/FFFFFF?text=Filtro',
  },
  {
    id: 'rel-2',
    nome: 'Pastilha de freio Pro',
    preco: '199.90',
    foto: 'https://via.placeholder.com/120x90/4B5BA8/FFFFFF?text=Freio',
  },
  {
    id: 'rel-3',
    nome: 'Bateria Cargo 100Ah',
    preco: '459.00',
    foto: 'https://via.placeholder.com/120x90/2A3B6B/FFFFFF?text=Bateria',
  },
  {
    id: 'rel-4',
    nome: 'Lâmpada LED H7',
    preco: '129.50',
    foto: 'https://via.placeholder.com/120x90/223355/FFFFFF?text=Lâmpada',
  },
];

const CompatibilityChip = ({ item }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>
      {item.marca} {item.modelo} ({item.ano_inicio} – {item.ano_fim})
    </Text>
  </View>
);

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export default function DetalhePecaScreen({ route, navigation }) {
  const { partId } = route.params;
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;
  const priceAnimation = useRef(new Animated.Value(0)).current;

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 1.1],
    extrapolate: 'clamp',
  });

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

  useEffect(() => {
    if (!part) return;

    heroOpacity.setValue(0);
    contentTranslateY.setValue(40);
    priceAnimation.setValue(0);

    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 380,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(priceAnimation, {
        toValue: Number(part.preco) || 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [part, contentTranslateY, heroOpacity, priceAnimation]);

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

  const formattedPrice = Number(part?.preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const animatedPrice = priceAnimation.interpolate({
    inputRange: [0, Number(part?.preco || 0)],
    outputRange: ['R$ 0,00', formattedPrice],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando peça...</Text>
      </View>
    );
  }

  if (error || !part) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorIcon}>←</Text>
        <Text style={styles.errorTitle}>Algo deu errado</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.backButtonFallback} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonFallbackText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}> 
          <Animated.Image
            source={{ uri: part.foto_url || PLACEHOLDER_IMAGE }}
            style={[styles.heroImage, { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.contentCard, { transform: [{ translateY: contentTranslateY }] }]}> 
          <Text style={styles.partName}>{part.nome}</Text>

          <View style={styles.priceRow}>
            <Animated.Text style={styles.partPrice}>{animatedPrice}</Animated.Text>
            <View style={[styles.stockBadge, part.disponivel ? styles.stockAvailable : styles.stockUnavailable]}>
              <Text style={[styles.stockText, part.disponivel ? styles.stockTextAvailable : styles.stockTextUnavailable]}>
                {part.disponivel ? `${part.estoque} em estoque` : 'Esgotado'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitleBlock}>Descrição</Text>
          <Text style={styles.descriptionText}>{part.descricao}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitleBlock}>Compatível com</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            {part.compatibilidade.map((comp, index) => (
              <CompatibilityChip key={index} item={comp} />
            ))}
          </ScrollView>

          <View style={styles.ratingRow}>
            {[...Array(3)].map((_, index) => (
              <Ionicons key={`full-${index}`} name="star" size={16} color="#FFD60A" style={styles.starIcon} />
            ))}
            {[...Array(2)].map((_, index) => (
              <Ionicons key={`empty-${index}`} name="star-outline" size={16} color="#555" style={styles.starIcon} />
            ))}
            <Text style={styles.ratingText}>(sem avaliações ainda)</Text>
          </View>

          <Text style={styles.relatedTitle}>Peças relacionadas</Text>
          <FlatList
            data={RELATED_PARTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.relatedList}
            renderItem={({ item }) => (
              <View style={styles.relatedCard}>
                <Image source={{ uri: item.foto }} style={styles.relatedImage} resizeMode="cover" />
                <Text style={styles.relatedName} numberOfLines={2}>{item.nome}</Text>
                <Text style={styles.relatedPrice}>R$ {Number(item.preco).toFixed(2)}</Text>
              </View>
            )}
          />

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </Animated.ScrollView>

      <Animated.View style={[styles.floatingBack, { opacity: backOpacity }]}> 
        <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.floatingBackIcon}>←</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnCart} disabled>
          <Ionicons name="cart-outline" size={20} color="#FFF" />
          <Text style={styles.btnCartText}>Adicionar ao Carrinho</Text>
        </TouchableOpacity>
        <Text style={styles.cartTooltip}>Disponível em breve (AT-30)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

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

  heroContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },

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

  contentCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
  },
  partName: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: '#111',
    lineHeight: theme.typography.h2.lineHeight,
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
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '800',
    color: '#FF9500',
  },

  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stockAvailable: { backgroundColor: '#DCFCE7' },
  stockUnavailable: { backgroundColor: '#FEE2E2' },
  stockText: { fontSize: 12, fontWeight: '700' },
  stockTextAvailable: { color: '#16A34A' },
  stockTextUnavailable: { color: theme.colors.error },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 20,
  },

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
  sectionTitleBlock: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: 12,
  },

  descriptionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },

  chipsContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#2A5298',
    backgroundColor: '#0D1F3C',
    marginRight: 8,
  },
  chipText: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    color: '#7FA8D8',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
    marginBottom: 18,
  },
  starIcon: {
    marginRight: 4,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabledText,
  },

  relatedTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: 12,
  },
  relatedList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  relatedCard: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
    marginRight: 12,
    padding: 10,
  },
  relatedImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    marginBottom: 10,
  },
  relatedName: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.bodySmall.fontWeight,
    color: theme.colors.text,
    lineHeight: theme.typography.bodySmall.lineHeight,
    marginBottom: 6,
  },
  relatedPrice: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.primary,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingTop: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  btnCart: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  btnCartText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 10,
  },
  cartTooltip: {
    marginTop: 4,
    opacity: 0.9,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabledText,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 110,
  },
});
