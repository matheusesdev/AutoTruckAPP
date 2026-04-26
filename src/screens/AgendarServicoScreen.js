import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function AgendarServicoScreen() {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState(null);
  const [data, setData] = useState(null);
  const [hora, setHora] = useState(null);
  const [observacoes, setObservacoes] = useState('');

  const tipos = [
    'Troca de óleo', 'Revisão completa',
    'Alinhamento', 'Balanceamento',
    'Freios', 'Suspensão',
    'Elétrica', 'Outro'
  ];

  if (step === 1) {
    return (
      <View>
        <Text>Que tipo de serviço precisa?</Text>

        {tipos.map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTipo(t)}
            style={{ backgroundColor: tipo === t ? 'blue' : 'gray' }}
          >
            <Text>{t}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => setStep(2)}>
          <Text>Próximo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 2) {
    return (
      <ScrollView>
        <Calendar
          onDayPress={(day) => setData(day.dateString)}
        />

        <Text>Horários</Text>
        {["08:00","09:00","10:00"].map(h => (
          <TouchableOpacity key={h} onPress={() => setHora(h)}>
            <Text>{h}</Text>
          </TouchableOpacity>
        ))}

        <TextInput
          placeholder="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
        />

        <TouchableOpacity onPress={() => setStep(3)}>
          <Text>Próximo</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View>
      <Text>Resumo</Text>
      <Text>{tipo}</Text>
      <Text>{data} - {hora}</Text>

      <TouchableOpacity>
        <Text>Confirmar agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}