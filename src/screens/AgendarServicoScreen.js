import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker'; // Certifique-se de ter instalado
import { agendamentoService } from '../services/api';

// Configuração do calendário para PT-BR
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const AgendarServicoScreen = ({ navigation }) => {
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [tipoServico, setTipoServico] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const hoje = new Date().toISOString().split('T')[0];

  const tipos = [
    'Troca de óleo', 'Revisão completa', 'Alinhamento', 
    'Balanceamento', 'Freios', 'Suspensão', 'Elétrica', 'Outro'
  ];

  // Simulação de veículos (Aqui você usaria os dados que o Lucas integrou)
  const meusVeiculos = [
    { id: '1', nome: 'Nissan Sentra - ABC-1234' },
    { id: '2', nome: 'Hyundai Creta - XYZ-5678' }
  ];

  const carregarHorarios = async (data) => {
    setDataSelecionada(data);
    const slots = await agendamentoService.getHorariosDisponiveis(data);
    setHorariosDisponiveis(slots);
  };

  const confirmarAgendamento = async () => {
    setLoading(true);
    try {
      const payload = {
        tipo_servico: tipoServico,
        veiculo_id: veiculoId,
        data_agendada: `${dataSelecionada}T${horarioSelecionado}:00Z`,
        observacoes
      };
      await agendamentoService.criarAgendamento(payload);
      Alert.alert("Sucesso", "Agendamento realizado com sucesso!");
      navigation.navigate('MainTabs', { screen: 'Serviços' });
    } catch (error) {
      Alert.alert("Erro", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {passo === 1 && (
        <View>
          <Text style={styles.titulo}>Que tipo de serviço precisa?</Text>
          <View style={styles.grid}>
            {tipos.map(item => (
              <TouchableOpacity 
                key={item} 
                style={[styles.cardTipo, tipoServico === item && styles.cardAtivo]}
                onPress={() => setTipoServico(item)}
              >
                <Text style={[styles.txtTipo, tipoServico === item && styles.txtAtivo]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btnPrincipal} onPress={() => setPasso(2)} disabled={!tipoServico}>
            <Text style={styles.btnTexto}>Próximo</Text>
          </TouchableOpacity>
        </View>
      )}

      {passo === 2 && (
        <View>
          <Text style={styles.label}>Selecione o Veículo</Text>
          <Picker selectedValue={veiculoId} onValueChange={(item) => setVeiculoId(item)}>
            <Picker.Item label="Selecione um veículo..." value="" />
            {meusVeiculos.map(v => <Picker.Item key={v.id} label={v.nome} value={v.id} />)}
          </Picker>

          <Calendar
            minDate={hoje}
            onDayPress={day => carregarHorarios(day.dateString)}
            markedDates={{ [dataSelecionada]: { selected: true, selectedColor: 'orange' } }}
          />

          {dataSelecionada ? (
            <View style={styles.horariosGrid}>
              {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(h => (
                <TouchableOpacity 
                  key={h}
                  disabled={!horariosDisponiveis.includes(h)}
                  style={[
                    styles.btnHorario, 
                    horarioSelecionado === h && styles.cardAtivo,
                    !horariosDisponiveis.includes(h) && styles.btnDesativado
                  ]}
                  onPress={() => setHorarioSelecionado(h)}
                >
                  <Text style={horarioSelecionado === h ? styles.txtAtivo : {}}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TextInput 
            placeholder="Observações (opcional)" 
            multiline numberOfLines={3} 
            style={styles.input}
            onChangeText={setObservacoes}
          />

          <TouchableOpacity
            style={styles.btnPrincipal}
            onPress={() => setPasso(3)}
            disabled={!veiculoId || !dataSelecionada || !horarioSelecionado}
          >
            <Text style={styles.btnTexto}>Revisar Agendamento</Text>
          </TouchableOpacity>
        </View>
      )}

      {passo === 3 && (
        <View style={styles.resumo}>
          <Text style={styles.titulo}>Confirmação</Text>
          <Text>Serviço: {tipoServico}</Text>
          <Text>Veículo ID: {veiculoId}</Text>
          <Text>Data: {dataSelecionada}</Text>
          <Text>Hora: {horarioSelecionado}</Text>
          
          <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarAgendamento}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTexto}>Confirmar Agendamento</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardTipo: { width: '48%', padding: 15, borderWidth: 1, borderColor: '#DDD', marginBottom: 10, alignItems: 'center' },
  cardAtivo: { backgroundColor: '#007bff', borderColor: '#007bff' },
  txtAtivo: { color: '#FFF' },
  btnPrincipal: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnTexto: { color: '#FFF', fontWeight: 'bold' },
  label: { fontWeight: 'bold', marginTop: 10 },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  btnHorario: { padding: 10, borderWidth: 1, borderColor: '#EEE', margin: 5, width: '22%', alignItems: 'center' },
  btnDesativado: { backgroundColor: '#F5F5F5', opacity: 0.5 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, marginTop: 20, borderRadius: 5 },
  btnConfirmar: { backgroundColor: 'green', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  resumo: { padding: 20, backgroundColor: '#F9F9F9', borderRadius: 10 }
});

export default AgendarServicoScreen;
