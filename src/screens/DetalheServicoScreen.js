import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { agendamentoService } from '../services/api';

const DetalheServicoScreen = ({ route, navigation }) => {
  const { servico } = route.params;
  const [statusAtual, setStatusAtual] = useState(servico.status);
  const [loading, setLoading] = useState(false);

  const etapas = ['agendado', 'em análise', 'em manutenção', 'finalizado'];
  const indiceEtapa = etapas.indexOf(statusAtual.toLowerCase());

  const formatarDataCompleta = (dataString) => {
    const data = new Date(dataString);
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${data.toLocaleDateString('pt-BR', opcoes)} às ${hora}`;
  };

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar agendamento?',
      'Tem certeza de que deseja cancelar? Esta ação não pode ser desfeita.',
      [
        { text: 'Não, manter', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: confirmarCancelamento,
        },
      ],
    );
  };

  const confirmarCancelamento = async () => {
    setLoading(true);
    try {
      await agendamentoService.cancelarAgendamento(servico.id);
      setStatusAtual('cancelado');
      Alert.alert('Sucesso', 'Agendamento cancelado com sucesso.');
    } catch (error) {
      Alert.alert('Erro', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.iconGrande}>🛠️</Text>
        <Text style={styles.titulo}>{servico.tipo_servico}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.label}>Veículo</Text>
        <Text style={styles.valor}>{servico.veiculo_id}</Text>

        <View style={styles.divisor} />

        <Text style={styles.label}>Data e hora</Text>
        <Text style={styles.valor}>{formatarDataCompleta(servico.data_agendada)}</Text>

        <View style={styles.divisor} />

        <Text style={styles.label}>Status</Text>
        <View style={[styles.badge, statusAtual === 'cancelado' && styles.badgeCancelado]}>
          <Text style={styles.badgeText}>{statusAtual.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitulo}>Progresso do serviço</Text>
      <View style={styles.progressoContainer}>
        {etapas.map((etapa, index) => (
          <View key={etapa} style={styles.etapaWrapper}>
            <View
              style={[
                styles.ponto,
                index <= indiceEtapa && styles.pontoAtivo,
                statusAtual === 'cancelado' && styles.pontoCancelado,
              ]}
            />
            <Text style={styles.etapaTexto}>{etapa}</Text>
          </View>
        ))}
      </View>

      {statusAtual.toLowerCase() === 'agendado' && (
        <>
          <TouchableOpacity 
            style={styles.btnReagendar} 
            onPress={() => navigation.navigate('EditarAgendamento', { servico })}
          >
            <Text style={styles.btnTexto}>📅 Reagendar Serviço</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancelar} onPress={handleCancelar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTexto}>Cancelar agendamento</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  iconGrande: { fontSize: 60, marginBottom: 10 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  cardInfo: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  valor: { fontSize: 16, color: '#333', marginBottom: 15 },
  divisor: { height: 1, backgroundColor: '#EEE', marginBottom: 15 },
  badge: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  badgeCancelado: { backgroundColor: '#6c757d' },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  sectionTitulo: { marginTop: 30, marginBottom: 20, fontWeight: 'bold', fontSize: 16 },
  progressoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  etapaWrapper: { alignItems: 'center', flex: 1 },
  ponto: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#DDD', marginBottom: 8 },
  pontoAtivo: { backgroundColor: '#28a745' },
  pontoCancelado: { backgroundColor: '#6c757d' },
  etapaTexto: { fontSize: 10, color: '#666', textAlign: 'center' },
  btnReagendar: { backgroundColor: '#E87722', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnCancelar: { backgroundColor: '#dc3545', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default DetalheServicoScreen;
