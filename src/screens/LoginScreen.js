import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../services/api';
import useUserStore from '../store/userStore';
import { theme } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', senha: '' });
  const [serverError, setServerError] = useState('');

  const animValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const animations = animValues.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 420,
        delay: i * 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, animations).start();
  }, []);

  const setAuthData = useUserStore((state) => state.setAuthData);

  const validateEmail = (value) => {
    const ok = value.trim().includes('@') && value.trim().includes('.');
    setFieldErrors((s) => ({ ...s, email: ok ? '' : 'Informe um e-mail válido' }));
    return ok;
  };

  const validateSenha = (value) => {
    const ok = value.trim().length > 0;
    setFieldErrors((s) => ({ ...s, senha: ok ? '' : 'Digite sua senha' }));
    return ok;
  };

  const canSubmit = email.trim().length > 0 && senha.trim().length > 0 && !fieldErrors.email && !fieldErrors.senha;

  const handleEntrar = async () => {
    setServerError('');
    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      await validateEmail(email);
      await validateSenha(senha);

      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: senha,
      });

      const token =
        response?.data?.token ||
        response?.data?.access_token ||
        response?.data?.accessToken ||
        null;

      const usuario =
        response?.data?.usuario ||
        response?.data?.user ||
        response?.data?.usuarioLogado ||
        null;

      if (!token || !usuario) {
        setServerError('Resposta de login incompleta. Tente novamente.');
        return;
      }

      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(usuario));

      setAuthData({ token, user: usuario });

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      console.error(error);
      const rawMessage = error?.response?.data?.message;
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || error?.response?.data?.error || error?.message || 'E-mail ou senha incorretos';
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[theme.colors.primaryAlpha10, theme.colors.background]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.animatedRow,
                {
                  opacity: animValues[0],
                  transform: [
                    {
                      translateY: animValues[0].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.logo}>AutoTruck</Text>
              <Text style={styles.tagline}>Para quem vive na estrada</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.animatedRow,
                {
                  opacity: animValues[1],
                  transform: [
                    {
                      translateY: animValues[1].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} style={styles.leftIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor={theme.colors.disabledText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    validateEmail(v);
                    setServerError('');
                  }}
                />
              </View>
              {fieldErrors.email ? (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.animatedRow,
                {
                  opacity: animValues[2],
                  transform: [
                    {
                      translateY: animValues[2].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={styles.leftIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Digite sua senha"
                  placeholderTextColor={theme.colors.disabledText}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  value={senha}
                  onChangeText={(v) => {
                    setSenha(v);
                    validateSenha(v);
                    setServerError('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarSenha((prev) => !prev)}
                  disabled={loading}
                >
                  <Ionicons name={mostrarSenha ? 'eye-off' : 'eye'} size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {fieldErrors.senha ? <Text style={styles.fieldError}>{fieldErrors.senha}</Text> : null}
            </Animated.View>

            {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

            <Animated.View style={{ marginTop: 18 }}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!canSubmit || loading) && styles.loginButtonDisabled,
                ]}
                onPress={handleEntrar}
                disabled={!canSubmit || loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Entrar</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => navigation.navigate('EsqueciSenha')}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccountLink}
                onPress={() => navigation.navigate('Cadastro')}
                disabled={loading}
              >
                <Text style={styles.createAccountText}>
                  Ainda não tem conta? <Text style={styles.createAccountTextBold}>Criar conta</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: { flex: 1 },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 36,
  },
  logo: {
    ...theme.typography.h1,
    textAlign: 'center',
    color: theme.colors.primary,
    marginTop: 18,
    marginBottom: 6,
  },
  tagline: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 24,
    opacity: 0.85,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loginButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: theme.colors.disabledText,
    fontSize: theme.typography.bodySmall.fontSize,
  },
  createAccountLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  createAccountText: {
    color: theme.colors.disabledText,
    fontSize: theme.typography.bodySmall.fontSize,
  },
  createAccountTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  leftIcon: { marginLeft: 8, marginRight: 8 },
  fieldError: { color: theme.colors.error, marginTop: 6, fontSize: theme.typography.bodySmall.fontSize },
  serverError: { color: theme.colors.error, marginTop: 12, textAlign: 'center' },
  animatedRow: { marginBottom: 8 },
});
