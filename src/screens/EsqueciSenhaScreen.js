import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export default function EsqueciSenhaScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canSubmit = email.trim().includes('@') && email.trim().includes('.');

  async function enviarRecuperacao() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setFeedback({
        type: 'success',
        message:
          response?.data?.message ||
          'Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperar sua senha.',
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Nao foi possivel solicitar a recuperacao de senha.';
      setFeedback({
        type: 'error',
        message: Array.isArray(message) ? message.join('\n') : message,
      });
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
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail para receber as instrucoes de recuperacao.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFeedback(null);
            }}
            editable={!loading}
          />

          {feedback ? (
            <View
              style={[
                styles.feedback,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'success'
                    ? styles.feedbackTextSuccess
                    : styles.feedbackTextError,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            onPress={enviarRecuperacao}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Enviar instrucoes</Text>
            )}
          </TouchableOpacity>

          {feedback?.type === 'success' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Voltar para login</Text>
            </TouchableOpacity>
          ) : null}
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
  },
  feedback: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextError: {
    color: '#B91C1C',
  },
  button: {
    marginTop: 18,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
