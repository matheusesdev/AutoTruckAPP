import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { orcamentoService, fetchVehicles } from '../services/api';
import useUserStore from '../store/userStore';
import { theme } from '../utils/theme';

export default function SolicitarOrcamentoScreen({ navigation }) {
  const authenticatedUser = useUserStore((state) => state.user);
  const [descricao, setDescricao] = useState('');
  const [veiculo_id, setVeiculoId] = useState('');
  const [nomePeca, setNomePeca] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [isLoadingVeiculos, setIsLoadingVeiculos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    try {
      setIsLoadingVeiculos(true);
      const data = await fetchVehicles();
      setVeiculos(Array.isArray(data) ? data : data.vehicles || []);
      if (data.length > 0 || (data.vehicles && data.vehicles.length > 0)) {
        const firstVehicle = Array.isArray(data) ? data[0] : data.vehicles[0];
        setVeiculoId(firstVehicle.id.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      Alert.alert('Aviso', 'Não foi possível carregar os veículos. Verifique sua conexão.');
    } finally {
      setIsLoadingVeiculos(false);
    }
  };

  const isValid = descricao.length >= 20 && nomePeca.length >= 3 && veiculo_id;

  const handleEnviar = async () => {
    if (!isValid) {
      Alert.alert('Validação', 'Preencha todos os campos corretamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dados = {
        veiculo_id: parseInt(veiculo_id),
        nome_peca: nomePeca,
        descricao,
      };

      const response = await orcamentoService.solicitarOrcamento(dados);
      
      Alert.alert('Sucesso', 'Sua solicitação de orçamento foi enviada com sucesso!', [
        {
          text: 'Visualizar orçamentos',
          onPress: () => navigation.navigate('Orçamentos'),
        },
        {
          text: 'OK',
          onPress: () => {
            // Limpar o formulário
            setDescricao('');
            setNomePeca('');
          },
        },
      ]);
    } catch (error) {
      console.error('Erro ao solicitar orçamento:', error);
      Alert.alert('Erro', error.message || 'Erro ao solicitar orçamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingVeiculos) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Solicitar orçamento</Text>
      
      <Text style={styles.label}>Seu veículo</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={veiculo_id}
          onValueChange={setVeiculoId}
          style={styles.picker}
        >
          <Picker.Item label="Selecione um veículo..." value="" />
          {veiculos.map((veiculo) => (
            <Picker.Item
              key={veiculo.id}
              label={`${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`}
              value={veiculo.id.toString()}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Nome da peça</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Farol dianteiro LED"
        value={nomePeca}
        onChangeText={setNomePeca}
        editable={!isSubmitting}
      />
      <Text style={styles.charCount}>{nomePeca.length}/100</Text>

      <Text style={styles.label}>Descrição detalhada</Text>
      <TextInput
        multiline
        placeholder="Descreva com detalhes a peça que precisa, características, especificações..."
        value={descricao}
        onChangeText={setDescricao}
        style={styles.textArea}
        editable={!isSubmitting}
      />
      <Text style={styles.charCount}>{descricao.length}/500</Text>

      <TouchableOpacity
        onPress={handleEnviar}
        disabled={!isValid || isSubmitting}
        style={[
          styles.button,
          (!isValid || isSubmitting) && styles.buttonDisabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar solicitação</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.info}>
        💡 Quanto mais detalhes fornecer, melhor será o orçamento que receberá.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: theme.colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    color: theme.colors.text,
    minHeight: 44,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    minHeight: 120,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    textAlign: 'right',
  },
  button: {
    backgroundColor: theme.colors.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
});
