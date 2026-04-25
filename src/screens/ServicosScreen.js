import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ServicosScreen() {
  const [tab, setTab] = useState('proximos');

  return (
    <View>
      {/* Abas */}
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => setTab('proximos')}>
          <Text>Próximos</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setTab('historico')}>
          <Text>Histórico</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      {tab === 'proximos' ? (
        <Text>Lista de próximos serviços</Text>
      ) : (
        <Text>Histórico de serviços</Text>
      )}
    </View>
  );
}