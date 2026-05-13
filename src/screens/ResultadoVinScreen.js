import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { theme } from '../utils/theme';
import { fetchParts } from '../services/api';

// Card de apresentação para cada peça retornada por VIN.
function PartCard({ item, onPress }) {
  const preco = Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.nome}</Text>
        <View style={[styles.badge, styles.badgeVin]}>
          <Text style={[styles.badgeText, styles.badgeTextVin]}>Compatível com VIN</Text>
        </View>
        <Text style={styles.cardPrice}>{preco}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ResultadoVinScreen({ route, navigation }) {
  const vin = route?.params?.vin || '';
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca as peças compatíveis com o VIN recebido como parâmetro.
  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await fetchParts({ vin, page: 1, limit: 50 });
        const itens = Array.isArray(resultado.data) ? resultado.data : resultado.data || [];
        setParts(itens);
      } catch (e) {
        setError('Não foi possível buscar as peças para este VIN.');
      } finally {
        setLoading(false);
      }
    };

    if (vin) {
      loadResults();
    } else {
      setLoading(false);
    }
  }, [vin]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔎</Text>
      <Text style={styles.emptyTitle}>Nenhuma peça encontrada para este VIN</Text>
      <Text style={styles.emptySubtitle}>Tente outro VIN ou solicite um orçamento.</Text>
      <TouchableOpacity style={styles.btnLaranja} onPress={() => navigation.navigate('SolicitarOrcamento')}>
        <Text style={styles.btnLaranjaText}>Solicitar orçamento</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Peças para VIN {vin}</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Buscando peças compatíveis...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={parts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PartCard item={item} onPress={() => navigation.navigate('DetalhePeca', { partId: item.id })} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
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
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.disabledText,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 15,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardBody: {
    minHeight: 100,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  cardPrice: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.disabledText,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnLaranja: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnLaranjaText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
