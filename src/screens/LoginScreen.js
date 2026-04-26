import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../services/api';
import useUserStore from '../store/userStore';
import { theme } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const setAuthData = useUserStore((state) => state.setAuthData);

  const canSubmit = email.trim().length > 0 && senha.trim().length > 0;

  const handleEntrar = async () => {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      // Chamada de autenticação conforme requisito da AT.
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: senha,
      });

      // Mantém compatibilidade com possíveis formatos de resposta da API.
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
        throw new Error('Resposta de login incompleta.');
      }

      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(usuario));

      setAuthData({ token, user: usuario });

      // Reseta o histórico para não voltar ao Login ao pressionar "voltar".
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error(error);

      const rawMessage = error?.response?.data?.message;

      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || error?.response?.data?.error || error?.message || 'E-mail ou senha incorretos';

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>AutoTruck</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite sua senha"
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarSenha((prev) => !prev)}
                disabled={loading}
              >
                <Ionicons
                  name={mostrarSenha ? 'eye-off' : 'eye'}
                  size={22}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, !canSubmit || loading ? styles.loginButtonDisabled : null]}
            onPress={handleEntrar}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordLink} disabled>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 36,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 42,
  },
  inputGroup: {
    marginBottom: 14,
  },
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
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
    backgroundColor: '#E87722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#64748B',
    fontSize: 14,
  },
  createAccountLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#475569',
    fontSize: 14,
  },
  createAccountTextBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
