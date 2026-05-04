import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../services/api';
import { theme } from '../utils/theme';

export default function NovaSenhaScreen({ navigation, route }) {
  const [token, setToken] = useState(route?.params?.token || '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const senhaValida = senha.length >= 6;
  const senhasIguais = senha === confirmarSenha && confirmarSenha.length > 0;
  const canSubmit = token.trim().length > 0 && senhaValida && senhasIguais;

  async function redefinirSenha() {
    if (loading) return;

    if (!token.trim()) {
      Alert.alert('Erro', 'Token de recuperação ausente.');
      return;
    }

    if (!senhaValida) {
      Alert.alert('Erro', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!senhasIguais) {
      Alert.alert('Erro', 'A confirmação deve ser igual à nova senha.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        token: token.trim(),
        password: senha,
      });

      Alert.alert('Senha redefinida', 'Use sua nova senha para entrar.', [
        {
          text: 'Entrar',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            }),
        },
      ]);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Não foi possível redefinir sua senha.';
      Alert.alert('Erro', Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Nova senha</Text>
          <Text style={styles.subtitle}>
            Defina uma nova senha para acessar sua conta AutoTruck.
          </Text>

          {!route?.params?.token ? (
            <>
              <Text style={styles.label}>Token</Text>
              <TextInput
                style={styles.input}
                placeholder="Cole o token recebido por e-mail"
                autoCapitalize="none"
                value={token}
                onChangeText={setToken}
                editable={!loading}
              />
            </>
          ) : null}

          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo de 6 caracteres"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!loading}
          />

          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a senha novamente"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            onPress={redefinirSenha}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Redefinir senha</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 28 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 14,
  },
  button: {
    marginTop: 4,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
