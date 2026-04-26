import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet
} from 'react-native';
import api from '../services/api';
import { theme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function VeiculosScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const res = await api.get('/vehicles');
    setVeiculos(res.data);
  }

  useFocusEffect(
  useCallback(() => {
    load();
  }, [])
);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      {veiculos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.text}>🚚</Text>
          <Text style={styles.text}>Nenhum veículo cadastrado</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.link}>Cadastrar meu primeiro veículo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={veiculos}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.marca} {item.modelo}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.placa}</Text>
              </View>
              <Text style={styles.info}>{item.ano} • {item.motor}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Cadastro')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
  link: { color: '#E87722', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  title: { fontWeight: 'bold' },
  badge: { backgroundColor: '#007BFF', padding: 5, borderRadius: 5, alignSelf: 'flex-start', marginTop: 5 },
  badgeText: { color: '#fff' },
  info: { fontSize: 12, marginTop: 5 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#E87722', padding: 20, borderRadius: 50 },
  fabText: { color: '#fff', fontSize: 20 }
});