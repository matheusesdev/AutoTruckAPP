import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const orcamentos = [
  {
    id: 1,
    descricao: "Farol dianteiro Volvo FH 2020",
    status: "Aguardando",
    data: "Hoje",
    veiculo: "Volvo FH"
  }
];

export default function OrcamentosScreen({ navigation }) {
  const getStatusColor = (status) => {
    if (status === "Aguardando") return "gray";
    if (status === "Em análise") return "orange";
    if (status === "Respondido") return "green";
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      
      {/* BOTÃO + */}
      <TouchableOpacity
        onPress={() => navigation.navigate('SolicitarOrcamento')}
        style={{
          backgroundColor: 'orange',
          padding: 15,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          + Solicitar orçamento
        </Text>
      </TouchableOpacity>

      <FlatList
        data={orcamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{
            padding: 16,
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: 10
          }}>
            <Text numberOfLines={2}>{item.descricao}</Text>
            <Text>{item.veiculo}</Text>
            <Text>{item.data}</Text>

            <Text style={{
              backgroundColor: getStatusColor(item.status),
              color: '#fff',
              padding: 5,
              marginTop: 5,
              alignSelf: 'flex-start'
            }}>
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}