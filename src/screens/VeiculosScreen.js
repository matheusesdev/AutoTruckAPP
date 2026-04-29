import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function VeiculosScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setVeiculos([]); // 🔥 ADICIONADO
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  async function load(reset = false) {
    if (loadingMore) return;

    setLoadingMore(true);

    const currentPage = reset ? 1 : page;

    try {
      const res = await api.get('/vehicles', {
        params: {
          page: currentPage,
          limit: 20,
          search: debouncedSearch
        }
      });

      if (reset) {
        setVeiculos(res.data.dados);
      } else {
        setVeiculos(prev => [...prev, ...res.data.dados]);
      }

      setTotal(res.data.total);
      setPage(currentPage + 1);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMore(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [debouncedSearch])
  );

  function loadMore() {
    if (!loadingMore && veiculos.length < total) { // 🔥 ALTERADO
      load();
    }
  }

  return (
    <View style={styles.container}>

      {/* BUSCA */}
      <View style={styles.searchContainer}>
        <Text>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Buscar por placa ou modelo..."
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text>❌</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTADOR */}
      <Text style={styles.count}>
        {total} veículos cadastrados
      </Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CadastroVeiculo')}
      >
        <Text style={styles.addButtonText}>Cadastrar veiculo</Text>
      </TouchableOpacity>

      <FlatList
        data={veiculos}
        keyExtractor={item => String(item.id)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('EditarVeiculo', { vehicle: item })
            }
          >
            <Text style={styles.title}>
              {item.marca} {item.modelo}
            </Text>

            <Text>{item.placa}</Text>
            <Text>{item.ano} • {item.motor}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 10
  },

  input: { flex: 1, marginLeft: 10 },

  count: { marginVertical: 10, fontWeight: 'bold' },

  addButton: {
    backgroundColor: '#E87722',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12
  },

  addButtonText: { color: '#fff', fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },

  title: { fontWeight: 'bold' }
});
