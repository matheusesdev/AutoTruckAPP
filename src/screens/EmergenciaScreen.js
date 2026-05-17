// src/screens/EmergenciaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../utils/theme';
import { solicitarEmergencia } from '../services/emergenciaService';

export default function EmergenciaScreen({ navigation }) {
  const [descricao, setDescricao] = useState('');
  const [localizacao, setLocalizacao] = useState(null);
  const [endereco, setEndereco] = useState('');
  const [carregandoGPS, setCarregandoGPS] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obterLocalizacao();
  }, []);

  const obterLocalizacao = async () => {
    setCarregandoGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Ative a localização nas configurações do dispositivo para continuar.',
          [{ text: 'OK' }]
        );
        setCarregandoGPS(false);
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = posicao.coords;
      setLocalizacao({ latitude, longitude });

      // Obter endereço legível
      const enderecos = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (enderecos.length > 0) {
        const e = enderecos[0];
        const enderecoFormatado = [e.street, e.district, e.city, e.region]
          .filter(Boolean)
          .join(', ');
        setEndereco(enderecoFormatado);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização. Tente novamente.');
    } finally {
      setCarregandoGPS(false);
    }
  };

  const handleEnviar = async () => {
    if (!localizacao) {
      Alert.alert('Localização necessária', 'Aguarde a obtenção da sua localização ou tente novamente.');
      return;
    }

    if (descricao.trim().length < 10) {
      Alert.alert('Descrição inválida', 'Descreva o problema com pelo menos 10 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      await solicitarEmergencia({
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        endereco,
        descricao: descricao.trim(),
      });

      Alert.alert(
        '✅ Emergência enviada!',
        'Sua solicitação foi recebida. Um mecânico disponível entrará em contato em breve.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const rawMessage = error?.response?.data?.message || error?.message || 'Não foi possível enviar a emergência. Tente novamente.';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage);
      Alert.alert('Erro', message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header de alerta */}
      <View style={styles.alertHeader}>
        <Ionicons name="warning" size={32} color="#FFFFFF" />
        <Text style={styles.alertTitle}>Atendimento Emergencial</Text>
        <Text style={styles.alertSubtitle}>
          Preencha as informações abaixo. Nossa equipe será acionada imediatamente.
        </Text>
      </View>

      {/* Localização */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Sua localização</Text>
        <View style={styles.localizacaoCard}>
          {carregandoGPS ? (
            <View style={styles.gpsCarregando}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.gpsTexto}>Obtendo localização via GPS...</Text>
            </View>
          ) : localizacao ? (
            <View>
              <Text style={styles.enderecoTexto}>{endereco || 'Endereço não disponível'}</Text>
              <Text style={styles.coordenadas}>
                {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity style={styles.atualizarBtn} onPress={obterLocalizacao}>
                <Ionicons name="refresh" size={14} color={theme.colors.accent} />
                <Text style={styles.atualizarTexto}>Atualizar localização</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.erroGPS}>Localização não obtida</Text>
              <TouchableOpacity style={styles.atualizarBtn} onPress={obterLocalizacao}>
                <Ionicons name="location" size={14} color={theme.colors.accent} />
                <Text style={styles.atualizarTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Descrição do problema */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Descrição do problema</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Pneu furado, motor superaquecendo, falha elétrica..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={5}
          value={descricao}
          onChangeText={setDescricao}
          maxLength={500}
        />
        <Text style={styles.contador}>{descricao.length}/500</Text>
      </View>

      {/* TODO: aplicar layout UI-06 nas seções de localização e descrição */}

      {/* Botão de envio */}
      <TouchableOpacity
        style={[styles.botaoEmergencia, (enviando || !localizacao) && styles.botaoDesabilitado]}
        onPress={handleEnviar}
        disabled={enviando || !localizacao}
      >
        {enviando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="flash" size={22} color="#FFF" />
            <Text style={styles.botaoTexto}>Solicitar Atendimento Emergencial</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.aviso}>
        ⚠️ Use somente em situações de emergência real.
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  alertHeader: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadow.md,
  },
  alertTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  localizacaoCard: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gpsCarregando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  gpsTexto: {
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: theme.spacing.sm,
  },
  enderecoTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  coordenadas: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  erroGPS: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  atualizarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  atualizarTexto: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  contador: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  botaoEmergencia: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow.md,
  },
  botaoDesabilitado: {
    backgroundColor: theme.colors.disabled,
  },
  botaoTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: theme.spacing.sm,
  },
  aviso: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: theme.spacing.md,
  },
});