import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, Image,
  TouchableOpacity, StyleSheet, Animated,
  Dimensions, ActivityIndicator, Platform,
  Modal, ScrollView, Alert, PermissionsAndroid,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SkeletonBox from '../components/SkeletonBox';
import { theme } from '../utils/theme';
import { fetchParts, fetchVehicles } from '../services/api';
import { salvarCache, carregarCache } from '../utils/cache';
import { useConectividade } from '../hooks/useConectividade';
 
const PLACEHOLDER = 'https://via.placeholder.com/300x200/1B3A6B/FFFFFF?text=AutoTruck';
const CACHE_KEY = 'pecas_catalogo';
 
// ─── Card de peça ─────────────────────────────────────────────────────────────
function PartCard({ item, onPress, compatible }) {
  const [badgeScale] = useState(() => new Animated.Value(1));
  const availability = item.disponibilidade
    ? item.disponibilidade
    : item.disponivel
      ? 'Disponível'
      : 'Indisponível';
  const isDisponivel = availability === 'Disponível';

  useEffect(() => {
    if (!isDisponivel) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(badgeScale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [badgeScale, isDisponivel]);

  const badgeStyles = {
    'Disponível': [styles.badge, styles.badgeDisponivel],
    'Indisponível': [styles.badge, styles.badgeIndisponivel],
    'Sob consulta': [styles.badge, styles.badgeConsulta],
  }[availability] || [styles.badge, styles.badgeIndisponivel];

  const badgeTextStyle = {
    'Disponível': styles.badgeTextDisponivel,
    'Indisponível': styles.badgeTextIndisponivel,
    'Sob consulta': styles.badgeTextConsulta,
  }[availability] || styles.badgeTextIndisponivel;

  const preco = Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.86}>
      <Image source={{ uri: item.foto_url || PLACEHOLDER }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.cardCode} numberOfLines={1}>{item.codigo ?? item.referencia ?? `ID ${item.id}`}</Text>
        <Text style={styles.cardPrice}>{preco}</Text>
        {isDisponivel ? (
          <Animated.View style={[...badgeStyles, { transform: [{ scale: badgeScale }] }]}>
            <Text style={badgeTextStyle}>{availability}</Text>
          </Animated.View>
        ) : (
          <View style={badgeStyles}>
            <Text style={badgeTextStyle}>{availability}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
 
// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBox width={80} height={80} borderRadius={10} />
      <View style={styles.skeletonDetails}>
        <SkeletonBox width="90%" height={16} borderRadius={10} />
        <SkeletonBox width="60%" height={14} borderRadius={10} />
        <SkeletonBox width="40%" height={18} borderRadius={10} />
      </View>
    </View>
  );
}
 
// ─── Tela principal ───────────────────────────────────────────────────────────
export default function PecasScreen({ navigation, route }) {
  const { temInternet } = useConectividade();
 
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
 
  const [search, setSearch] = useState('');
  const [searchAtivo, setSearchAtivo] = useState('');
  // Alterna entre busca do catálogo e busca por VIN.
  const [modoBusca, setModoBusca] = useState('catalogo');
  const [vinTexto, setVinTexto] = useState('');
  const [vinResultados, setVinResultados] = useState([]);
  const [vinBuscando, setVinBuscando] = useState(false);
  const [vinSemResultado, setVinSemResultado] = useState(false);
  const resultCount = modoBusca === 'vin' ? vinResultados.length : parts.length;
 
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [loadingVeiculos, setLoadingVeiculos] = useState(false);
 
  const [offline, setOffline] = useState(false);
  const [cacheData, setCacheData] = useState(null);
  const [semCache, setSemCache] = useState(false);
 
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const searchTimer = useRef(null);
  const internetAnterior = useRef(temInternet);
 
  // Animação skeleton
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
 
  // Debounce da busca
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchAtivo(search);
      setPage(1);
      setParts([]);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);
 
  // Reconectar → recarrega
  useEffect(() => {
    if (!internetAnterior.current && temInternet) {
      carregarPecas(1, true);
    }
    internetAnterior.current = temInternet;
  }, [temInternet]);
 
  // Recebe parâmetros de navegação do scanner ou de outras telas.
  useEffect(() => {
    const initialVin = route?.params?.initialVin;
    const initialModo = route?.params?.initialModoBusca;
    if (initialModo === 'vin' || initialVin) {
      setModoBusca('vin');
      setVinTexto(initialVin || '');
      setSearch('');
      setSearchAtivo('');
      setPage(1);
      setParts([]);
    }
  }, [route?.params]);
 
  // Carrega quando muda busca ou veículo
  useEffect(() => {
    if (modoBusca === 'catalogo') {
      carregarPecas(1, true);
    }
  }, [searchAtivo, veiculoSelecionado, modoBusca]);
 
  useEffect(() => {
    if (modoBusca !== 'vin') return;
    const trimmed = vinTexto.trim();
    if (trimmed.length < 17) {
      setVinResultados([]);
      setVinSemResultado(false);
      return;
    }

    const timer = setTimeout(() => {
      carregarPecasVin(trimmed);
    }, 400);

    return () => clearTimeout(timer);
  }, [vinTexto, modoBusca]);
 
  async function carregarPecas(pageNum = 1, reset = false) {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    setSemCache(false);
 
    // Sem internet — tenta cache
    if (!temInternet) {
      setOffline(true);
      const cache = await carregarCache(CACHE_KEY);
      if (cache) {
        setParts(cache.data);
        setCacheData(cache.savedAt);
      } else {
        setParts([]);
        setSemCache(true);
      }
      setLoading(false);
      setLoadingMore(false);
      return;
    }
 
    // Com internet — busca API
    setOffline(false);
    try {
      const resultado = await fetchParts({
        search: searchAtivo,
        page: pageNum,
        limit: 20,
        veiculo_id: veiculoSelecionado?.id || null,
      });
 
      if (reset || pageNum === 1) {
        setParts(resultado.data);
      } else {
        setParts(prev => [...prev, ...resultado.data]);
      }
      setHasNextPage(resultado.meta.hasNextPage);
 
      // Salva cache só na primeira página sem filtros
      if (pageNum === 1 && !searchAtivo && !veiculoSelecionado) {
        await salvarCache(CACHE_KEY, { data: resultado.data, savedAt: new Date().toISOString() });
      }
    } catch (e) {
      // Falhou — tenta cache como fallback
      const cache = await carregarCache(CACHE_KEY);
      if (cache) {
        setParts(cache.data);
        setCacheData(cache.savedAt);
        setOffline(true);
      } else {
        setError('Erro ao carregar peças. Tente novamente.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }
 
  // Faz a busca de peças compatíveis com um VIN específico.
  async function carregarPecasVin(vin) {
    setVinBuscando(true);
    setError(null);
    setVinSemResultado(false);

    try {
      const resultado = await fetchParts({ vin, page: 1, limit: 50 });
      const itens = Array.isArray(resultado.data) ? resultado.data : resultado.data || [];
      setVinResultados(itens);
      setVinSemResultado(itens.length === 0);
    } catch (e) {
      if (e?.response?.status === 404) {
        setVinResultados([]);
        setVinSemResultado(true);
      } else {
        setError('Erro ao buscar VIN. Tente novamente.');
      }
    } finally {
      setVinBuscando(false);
    }
  }

  // Verifica permissão de câmera e navega para a tela de scanner.
  async function handlePressScanner() {
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (!hasPermission) {
        const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (status !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permissão necessária', 'Precisamos acessar a câmera para escanear códigos. Ative a permissão nas configurações.');
          return;
        }
      }
    }

    navigation.navigate('ScannerPeca');
  }

  function selecionarModoBusca(value) {
    setModoBusca(value);
    setError(null);
    setPage(1);
    setParts([]);
    setSearch('');
    setSearchAtivo('');
    setVinTexto('');
    setVinResultados([]);
    setVinSemResultado(false);
  }

  function handleLoadMore() {
    if (!loadingMore && hasNextPage && !loading && !offline) {
      const next = page + 1;
      setPage(next);
      carregarPecas(next);
    }
  }
 
  async function abrirModal() {
    setModalAberto(true);
    setLoadingVeiculos(true);
    try {
      const res = await fetchVehicles();
      setVeiculos(Array.isArray(res) ? res : res.data || []);
    } catch {
      setVeiculos([]);
    } finally {
      setLoadingVeiculos(false);
    }
  }
 
  function selecionarVeiculo(v) {
    setVeiculoSelecionado(v);
    setModalAberto(false);
    setParts([]);
    setPage(1);
  }
 
  function formatarData(iso) {
    if (!iso) return 'data desconhecida';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
 
  function renderEmpty() {
    if (semCache) return (
      <View style={styles.centro}>
        <Text style={styles.emptyIcon}>📡</Text>
        <Text style={styles.emptyTitulo}>Sem conexão</Text>
        <Text style={styles.emptySub}>Conecte à internet para ver o catálogo.</Text>
      </View>
    );
 
    if (veiculoSelecionado) return (
      <View style={styles.centro}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitulo}>
          Nenhuma peça compatível com{'\n'}
          {veiculoSelecionado.marca} {veiculoSelecionado.modelo} {veiculoSelecionado.ano}
        </Text>
        <TouchableOpacity style={styles.btnLaranja} onPress={() => navigation.navigate('SolicitarOrcamento')}>
          <Text style={styles.btnLaranjaText}>Solicitar orçamento para esta peça</Text>
        </TouchableOpacity>
      </View>
    );
 
    if (modoBusca === 'vin' && vinTexto.trim().length > 0 && vinTexto.trim().length < 17) return (
      <View style={styles.centro}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitulo}>Digite pelo menos 17 caracteres do VIN</Text>
        <Text style={styles.emptySubtitle}>Quando o VIN tiver 17 caracteres, mostraremos as peças compatíveis.</Text>
      </View>
    );

    if (modoBusca === 'vin' && vinSemResultado) return (
      <View style={styles.centro}>
        <Text style={styles.emptyIcon}>🔎</Text>
        <Text style={styles.emptyTitulo}>Nenhuma peça encontrada para este VIN</Text>
        <Text style={styles.emptySubtitle}>Verifique o VIN ou tente outro valor.</Text>
        <TouchableOpacity style={styles.btnLaranja} onPress={() => navigation.navigate('SolicitarOrcamento')}>
          <Text style={styles.btnLaranjaText}>Solicitar orçamento</Text>
        </TouchableOpacity>
      </View>
    );
 
    return (
      <View style={styles.centro}>
        <Text style={styles.emptyIcon}>🔩</Text>
        <Text style={styles.emptyTitulo}>Nenhuma peça encontrada</Text>
        <Text style={styles.emptySubtitle}>Tente buscar por outro termo.</Text>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
 
      <LinearGradient
        colors={['#1B3A6B', '#2A5298']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitulo}>Catálogo de Peças</Text>
        <Text style={styles.headerSubtitle}>{resultCount} peças encontradas</Text>
      </LinearGradient>
 
      {/* Banner offline */}
      {offline && !semCache && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerOfflineText}>
            ⚠️ Exibindo peças salvas · Última atualização: {formatarData(cacheData)}
          </Text>
        </View>
      )}
 
      {/* Busca e seletor — ocultos offline */}
      {!offline && (
        <>
          <View style={styles.buscaWrapper}>
            <View style={styles.buscaContainer}>
              <Ionicons name="search" size={20} color={theme.colors.disabledText} style={styles.searchIcon} />
              <TextInput
                style={styles.buscaInput}
                placeholder={modoBusca === 'vin' ? 'Digite o VIN do veículo' : 'Buscar peça...'}
                placeholderTextColor={theme.colors.disabledText}
                value={modoBusca === 'vin' ? vinTexto : search}
                onChangeText={modoBusca === 'vin' ? setVinTexto : setSearch}
                autoCorrect={false}
                autoCapitalize={modoBusca === 'vin' ? 'characters' : 'none'}
              />
              {modoBusca === 'catalogo' && (
                <TouchableOpacity onPress={handlePressScanner} style={styles.cameraButton}>
                  <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {modoBusca === 'catalogo' && searchAtivo.length > 0 && (
              <Text style={styles.buscandoText}>Buscando por '{searchAtivo}'...</Text>
            )}
            {modoBusca === 'vin' && vinTexto.trim().length > 0 && (
              <Text style={styles.buscandoText}>Buscando VIN ao digitar...</Text>
            )}
          </View>
 
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeChip, modoBusca === 'catalogo' && styles.modeChipActive]}
              onPress={() => selecionarModoBusca('catalogo')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeChipText, modoBusca === 'catalogo' && styles.modeChipTextActive]}>🔍 Catálogo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, modoBusca === 'vin' && styles.modeChipActive]}
              onPress={() => selecionarModoBusca('vin')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeChipText, modoBusca === 'vin' && styles.modeChipTextActive]}>🔬 VIN</Text>
            </TouchableOpacity>
          </View>
 
          <TouchableOpacity style={styles.seletorVeiculo} onPress={abrirModal} activeOpacity={0.8}>
            <Text>🚛 </Text>
            <Text style={[styles.seletorTexto, veiculoSelecionado && styles.seletorTextoAtivo]}>
              {veiculoSelecionado
                ? `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} ${veiculoSelecionado.ano}`
                : 'Todos os veículos'}
            </Text>
            <Text style={styles.seletorSeta}>▾</Text>
          </TouchableOpacity>
        </>
      )}
 
      {/* Banner veículo selecionado */}
      {veiculoSelecionado && !offline && (
        <View style={styles.bannerVeiculo}>
          <Text style={styles.bannerVeiculoText}>
            🔧 Peças para {veiculoSelecionado.marca} {veiculoSelecionado.modelo} {veiculoSelecionado.ano}
          </Text>
          <TouchableOpacity onPress={() => selecionarVeiculo(null)}>
            <Text style={styles.bannerVeiculoX}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {/* Erro */}
      {error && !loading && (
        <View style={styles.erroBox}>
          <Text style={styles.erroText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.btnLaranja} onPress={() => carregarPecas(1, true)}>
            <Text style={styles.btnLaranjaText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {modoBusca === 'vin' && vinBuscando && (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.accent} style={{ marginVertical: 24 }} />
          <Text style={styles.emptySubtitle}>Buscando compatibilidade para o VIN...</Text>
        </View>
      )}
 
      {/* Skeleton */}
      {loading && !error && (
        <View style={styles.grid}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </View>
      )}
 
      {!loading && !error && !(modoBusca === 'vin' && vinBuscando) && (
        <FlatList
          data={modoBusca === 'vin' ? vinResultados : parts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <PartCard
              item={item}
              compatible={modoBusca === 'vin'}
              onPress={item => navigation.navigate('DetalhePeca', { partId: item.id })}
            />
          )}
          contentContainerStyle={styles.listaContent}
          showsVerticalScrollIndicator={false}
          onEndReached={modoBusca === 'vin' ? null : handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore && modoBusca === 'catalogo' ? <ActivityIndicator color={theme.colors.accent} style={styles.footerLoader} /> : <View style={styles.footerSpacer} />}
          ListEmptyComponent={renderEmpty}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SolicitarOrcamento')}
        accessibilityLabel="Solicitar orçamento"
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
 
      {/* Modal de veículos */}
      <Modal visible={modalAberto} transparent animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalAberto(false)}>
          <View style={styles.modalBox}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>Selecionar Veículo</Text>
              <TouchableOpacity onPress={() => setModalAberto(false)}>
                <Text style={styles.modalFechar}>✕</Text>
              </TouchableOpacity>
            </View>
 
            {loadingVeiculos ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView>
                {/* Opção todos */}
                <TouchableOpacity
                  style={[styles.opcaoVeiculo, !veiculoSelecionado && styles.opcaoAtiva]}
                  onPress={() => selecionarVeiculo(null)}
                >
                  <Text style={[styles.opcaoTexto, !veiculoSelecionado && styles.opcaoTextoAtivo]}>
                    Todos os veículos
                  </Text>
                  {!veiculoSelecionado && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
 
                {veiculos.length === 0 && (
                  <View style={styles.centro}>
                    <Text style={styles.emptySubtitle}>Nenhum veículo cadastrado.</Text>
                    <Text style={styles.emptySubtitle}>Cadastre na aba Veículos.</Text>
                  </View>
                )}
 
                {veiculos.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.opcaoVeiculo, veiculoSelecionado?.id === v.id && styles.opcaoAtiva]}
                    onPress={() => selecionarVeiculo(v)}
                  >
                    <View>
                      <Text style={[styles.opcaoTexto, veiculoSelecionado?.id === v.id && styles.opcaoTextoAtivo]}>
                        {v.marca} {v.modelo} {v.ano}
                      </Text>
                      <Text style={styles.opcaoPlaca}>{v.placa}</Text>
                    </View>
                    {veiculoSelecionado?.id === v.id && <Text style={styles.check}>✓</Text>}
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
 
// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitulo: { ...theme.typography.h2, color: '#FFF' },
  headerSubtitle: { marginTop: 8, ...theme.typography.body, color: 'rgba(255,255,255,0.88)' },

  bannerOffline: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
  },
  bannerOfflineText: { fontSize: 12, color: '#92400E', fontWeight: '600', textAlign: 'center' },

  buscaWrapper: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    height: 52,
    ...theme.shadow.sm,
  },
  searchIcon: { marginRight: 12 },
  buscaInput: { flex: 1, color: theme.colors.text, ...theme.typography.body, padding: 0 },
  cameraButton: {
    marginLeft: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buscandoText: { fontSize: 12, color: theme.colors.disabledText, marginTop: 8, fontStyle: 'italic' },

  modeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  modeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modeChipText: {
    ...theme.typography.bodySmall,
    color: theme.colors.disabledText,
  },
  modeChipTextActive: {
    color: '#FFF',
  },

  seletorVeiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    ...theme.shadow.sm,
  },
  seletorTexto: { flex: 1, ...theme.typography.body, color: theme.colors.disabledText },
  seletorTextoAtivo: { color: theme.colors.primary, fontWeight: '700' },
  seletorSeta: { fontSize: 12, color: theme.colors.disabledText, marginLeft: 8 },

  bannerVeiculo: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryAlpha10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerVeiculoText: { flex: 1, ...theme.typography.body, color: theme.colors.primary },
  bannerVeiculoX: { marginLeft: 12, ...theme.typography.label, color: theme.colors.primary },

  grid: { paddingHorizontal: 16, paddingTop: 16 },
  listaContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 },
  footerLoader: { marginVertical: 16 },
  footerSpacer: { height: 24 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.md,
  },
  cardImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: theme.colors.surfaceElevated, marginRight: 16 },
  cardBody: { flex: 1 },
  cardName: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
  cardCode: { ...theme.typography.caption, color: theme.colors.disabledText, marginBottom: 8 },
  cardPrice: { ...theme.typography.h3, color: '#FF9500', marginBottom: 8 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full, marginTop: 4 },
  badgeDisponivel: { backgroundColor: '#0D3320' },
  badgeIndisponivel: { backgroundColor: '#3A1010' },
  badgeConsulta: { backgroundColor: '#2A2000' },
  badgeTextDisponivel: { ...theme.typography.caption, color: '#30D158', fontWeight: '700' },
  badgeTextIndisponivel: { ...theme.typography.caption, color: '#FF453A', fontWeight: '700' },
  badgeTextConsulta: { ...theme.typography.caption, color: '#FFD60A', fontWeight: '700' },

  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.sm,
  },
  skeletonDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    height: 80,
  },

  centro: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitulo: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 12, textAlign: 'center', lineHeight: 24 },
  emptySubtitle: { ...theme.typography.body, color: theme.colors.disabledText, textAlign: 'center' },

  btnLaranja: { backgroundColor: theme.colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  btnLaranjaText: { color: '#FFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },

  erroBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  erroText: { color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },

  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  modalFechar: { fontSize: 16, color: theme.colors.disabledText, padding: 4 },

  opcaoVeiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  opcaoAtiva: { backgroundColor: '#EFF6FF' },
  opcaoTexto: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  opcaoTextoAtivo: { color: theme.colors.primary, fontWeight: '700' },
  opcaoPlaca: { fontSize: 12, color: theme.colors.disabledText, marginTop: 2 },
  check: { fontSize: 16, color: theme.colors.primary, fontWeight: '700' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.lg,
    zIndex: 10,
  },
});