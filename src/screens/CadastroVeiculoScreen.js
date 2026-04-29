import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import api from '../services/api';
import { theme } from '../utils/theme';

export default function CadastroVeiculoScreen({ navigation }) {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [motor, setMotor] = useState('');

  async function salvar() {
    if (!marca || !modelo || !ano || !placa || !motor) {
      return Alert.alert('Erro', 'Preencha tudo');
    }

    await api.post('/vehicles', {
      marca,
      modelo,
      ano: Number(ano),
      placa: placa.toUpperCase(),
      motor,
    });

    Alert.alert('Sucesso', 'Veiculo cadastrado!');
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <TextInput placeholder="Marca" style={styles.input} onChangeText={setMarca} />
      <TextInput placeholder="Modelo" style={styles.input} onChangeText={setModelo} />
      <TextInput placeholder="Ano" keyboardType="numeric" style={styles.input} onChangeText={setAno} />
      <TextInput placeholder="Placa" style={styles.input} onChangeText={(t) => setPlaca(t.toUpperCase())} />

      <Picker selectedValue={motor} onValueChange={setMotor}>
        <Picker.Item label="Selecione o motor" value="" />
        <Picker.Item label="Volvo" value="Volvo" />
        <Picker.Item label="Scania" value="Scania" />
        <Picker.Item label="MAN" value="MAN" />
        <Picker.Item label="Mercedes-Benz" value="Mercedes-Benz" />
        <Picker.Item label="Cummins" value="Cummins" />
        <Picker.Item label="Iveco" value="Iveco" />
        <Picker.Item label="DAF" value="DAF" />
        <Picker.Item label="Outro" value="Outro" />
      </Picker>

      <TouchableOpacity style={styles.button} onPress={salvar}>
        <Text style={styles.buttonText}>Salvar veiculo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  input: { backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#E87722', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff' },
});
