import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function SolicitarOrcamentoScreen() {
  const [descricao, setDescricao] = useState('');

  const isValid = descricao.length >= 20;

  const handleEnviar = () => {
    Alert.alert('Sucesso', 'Solicitação enviada! Retornaremos em breve.');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20 }}>Solicitar orçamento</Text>

      <TextInput
        multiline
        placeholder="Descreva a peça que precisa..."
        value={descricao}
        onChangeText={setDescricao}
        style={{
          borderWidth: 1,
          height: 120,
          marginTop: 10,
          padding: 10,
        }}
      />

      <Text>{descricao.length}/500</Text>

      <TouchableOpacity
        onPress={handleEnviar}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? 'orange' : 'gray',
          padding: 15,
          marginTop: 20,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Enviar solicitação
        </Text>
      </TouchableOpacity>
    </View>
  );
}
