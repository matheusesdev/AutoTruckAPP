import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function EditarVeiculoScreen({ route, navigation }) {
  const { vehicle } = route.params;

  const [marca, setMarca] = useState(vehicle.marca);
  const [modelo, setModelo] = useState(vehicle.modelo);
  const [ano, setAno] = useState(String(vehicle.ano));
  const [placa, setPlaca] = useState(vehicle.placa);
  const [motor, setMotor] = useState(vehicle.motor);
  const [loading, setLoading] = useState(false);

  const changed =
    marca !== vehicle.marca ||
    modelo !== vehicle.modelo ||
    ano !== String(vehicle.ano) ||
    placa !== vehicle.placa ||
    motor !== vehicle.motor;

  async function salvar() {
    setLoading(true);
    try {
      await api.put(`/vehicles/${vehicle.id}`, {
        marca,
        modelo,
        ano: Number(ano),
        placa,
        motor,
      });

      Alert.alert('Sucesso', 'Veículo atualizado');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar');
    } finally {
      setLoading(false);
    }
  }

  function confirmarRemocao() {
    Alert.alert(
      'Remover veículo?',
      'Esta ação não pode ser desfeita. Todos os dados deste veículo serão removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, remover',
          style: 'destructive',
          onPress: remover,
        },
      ],
    );
  }

  async function remover() {
    setLoading(true);
    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível remover');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput value={marca} onChangeText={setMarca} placeholder="Marca" />
      <TextInput value={modelo} onChangeText={setModelo} placeholder="Modelo" />
      <TextInput value={ano} onChangeText={setAno} placeholder="Ano" keyboardType="numeric" />
      <TextInput value={placa} onChangeText={setPlaca} placeholder="Placa" />
      <TextInput value={motor} onChangeText={setMotor} placeholder="Motor" />

      <TouchableOpacity
        disabled={!changed || loading}
        onPress={salvar}
        style={{ backgroundColor: 'orange', padding: 10, marginTop: 20 }}
      >
        {loading ? <ActivityIndicator /> : <Text>Salvar alterações</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={confirmarRemocao}
        style={{ backgroundColor: 'red', padding: 10, marginTop: 10 }}
      >
        <Text style={{ color: '#fff' }}>Remover veículo</Text>
      </TouchableOpacity>
    </View>
  );
}