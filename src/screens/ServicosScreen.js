import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { agendamentoService } from '../services/api';

const ServicosScreen = ({ navigation }) => {
  const [aba, setAba] = useState('proximos');
  const [dados, setDados] = useState({ proximosServicos: [], historicoServicos: [] });

  useEffect(() => {
    const fetch = async () => {
      const res = await agendamentoService.listarServicos();
      setDados(res);
    };
    fetch();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'agendado': return { bg: '#e3f2fd', txt: '#0d47a1' }; // Azul
      case 'em análise': return { bg: '#fff3e0', txt: '#e65100' }; // Laranja
      case 'em manutenção': return { bg: '#fffde7', txt: '#fbc02d' }; // Amarelo
      case 'finalizado': return { bg: '#e8f5e9', txt: '#1b5e20' }; // Verde
      default: return { bg: '#EEE', txt: '#333' };
    }
  };

  const renderCard = ({ item }) => {
    const statusColor = getStatusStyle(item.status.toLowerCase());
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.tipoServico}>{item.tipo_servico}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.txt }]}>{item.status}</Text>
          </View>
        </View>
        <Text>📅 {new Date(item.data_agendada).toLocaleDateString('pt-BR')} às {new Date(item.data_agendada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</Text>
        <Text>🚚 Veículo ID: {item.veiculo_id}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, aba === 'proximos' && styles.tabAtiva]} onPress={() => setAba('proximos')}>
          <Text>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, aba === 'historico' && styles.tabAtiva]} onPress={() => setAba('historico')}>
          <Text>Histórico</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={aba === 'proximos' ? dados.proximosServicos : dados.historicoServicos}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text>Nenhum serviço encontrado.</Text>
            <TouchableOpacity style={styles.btnNovo} onPress={() => navigation.navigate('Agendar')}>
              <Text style={{ color: '#FFF' }}>Agendar Agora</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabAtiva: { borderBottomColor: '#007bff' },
  card: { backgroundColor: '#FFF', margin: 10, padding: 15, borderRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tipoServico: { fontWeight: 'bold', fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  vazio: { alignItems: 'center', marginTop: 50 },
  btnNovo: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginTop: 15 }
});

export default ServicosScreen;

export default function ServicosScreen() {
  return (
    <View style={styles.container}><Text style={styles.text}>Agendamento de Serviços</Text></View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  text: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary }
});