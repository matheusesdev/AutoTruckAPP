import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

// Função para formatar data em pt-BR
const formatarData = (dataISO) => {
  const data = new Date(dataISO);

  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ` às ${data.getHours()}h`;
};

// Cores do status
const corStatus = {
  agendado: 'blue',
  em_analise: 'orange',
  em_manutencao: 'yellow',
  finalizado: 'green',
  cancelado: 'gray'
};

export default function DetalheServicoScreen({ route }) {
  const { servico } = route.params;

  const [status, setStatus] = useState(servico.status);
  const [loading, setLoading] = useState(false);

  const cancelar = () => {
    Alert.alert(
      "Cancelar agendamento?",
      "Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.",
      [
        { text: "Não, manter", style: "cancel" },
        {
          text: "Sim, cancelar",
          onPress: async () => {
            try {
              setLoading(true);

              await fetch(`http://SEU_IP:3000/services/${servico.id}/cancelar`, {
                method: 'PATCH'
              });

              setStatus('cancelado');

              Alert.alert("Sucesso", "Agendamento cancelado");
            } catch (err) {
              Alert.alert("Erro", "Não foi possível cancelar");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Tipo de serviço */}
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
        {servico.tipo_servico}
      </Text>

      {/* Veículo */}
      <Text style={{ marginTop: 10 }}>
        Veículo: {servico.veiculo_id}
      </Text>

      {/* Data */}
      <Text style={{ marginTop: 10 }}>
        {formatarData(servico.data_agendada)}
      </Text>

      {/* Status */}
      <View style={{
        backgroundColor: corStatus[status],
        padding: 8,
        marginVertical: 10,
        borderRadius: 5
      }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {status}
        </Text>
      </View>

      {/* Barra de progresso simples */}
      <Text>
        Agendado → Em análise → Em manutenção → Finalizado
      </Text>

      {/* Loading */}
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

      {/* Botão cancelar */}
      {status === 'agendado' && (
        <TouchableOpacity
          onPress={cancelar}
          style={{
            backgroundColor: 'red',
            padding: 12,
            marginTop: 20,
            borderRadius: 5
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            Cancelar agendamento
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}