import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../services/api';
import { theme } from '../utils/theme';

export default function EsqueciSenhaScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [serverMessage, setServerMessage] = useState('');
  const [fieldError, setFieldError] = useState('');

  const entrance = useRef(new Animated.Value(0)).current;
  const envelopeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (step === 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(envelopeScale, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(envelopeScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [step]);

  const canSubmit = email.trim().includes('@') && email.trim().includes('.');

  async function enviarRecuperacao() {
    setFieldError('');
    setServerMessage('');
    if (!canSubmit || loading) {
      if (!canSubmit) setFieldError('Informe um e-mail válido');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setServerMessage(response?.data?.message || 'Se o e-mail estiver cadastrado, enviaremos as instruções.');
      setStep(2);
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Não foi possível solicitar a recuperação de senha.';
      setServerMessage(Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.content, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0,1], outputRange: [18,0] }) }] }]}> 
          {step === 1 ? (
            <>
              <Animated.View style={styles.iconWrap}>
                <Animated.View style={{ transform: [{ scale: entrance.interpolate({ inputRange: [0,1], outputRange: [0.92, 1] }) }] }}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </Animated.View>
              </Animated.View>

              <Text style={styles.title}>Recuperar senha</Text>
              <Text style={styles.subtitle}>Informe seu e-mail para receber as instruções de recuperação.</Text>

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
                  setFieldError('');
                  setServerMessage('');
                }}
                editable={!loading}
              />
              {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}

              <TouchableOpacity style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]} onPress={enviarRecuperacao} disabled={!canSubmit || loading}>
                {loading ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.buttonText}>Enviar instruções</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Animated.View style={[styles.envelopeWrap, { transform: [{ scale: envelopeScale }] }]}> 
                <Text style={styles.envelopeIcon}>✉️</Text>
              </Animated.View>

              <Text style={styles.title}>Verifique seu e-mail</Text>
              <Text style={styles.subtitle}>{serverMessage || 'Enviamos as instruções para recuperar sua senha.'}</Text>

              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}><Text style={styles.backButtonText}>Voltar ao login</Text></TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  iconWrap: { marginBottom: 8 },
  lockIcon: { fontSize: 48 },
  envelopeWrap: { marginBottom: 12 },
  envelopeIcon: { fontSize: 48 },
  title: { ...theme.typography.h1, color: theme.colors.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: theme.typography.body.fontSize, color: theme.colors.disabledText, lineHeight: 22, marginBottom: 18, textAlign: 'center' },
  label: { ...theme.typography.label, color: theme.colors.primary, alignSelf: 'flex-start', marginBottom: 6 },
  input: { width: '100%', backgroundColor: theme.colors.inputBackground, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: theme.typography.body.fontSize, color: theme.colors.text },
  button: { marginTop: 18, height: 52, width: '100%', borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },
  fieldError: { color: theme.colors.error, marginTop: 8 },
  serverError: { color: theme.colors.error, marginTop: 12 },
  backButton: { marginTop: 16 },
  backButtonText: { color: theme.colors.primary, fontWeight: '700' },
});
