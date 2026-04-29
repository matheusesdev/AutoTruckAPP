import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';
import useUserStore from '../store/userStore';
import { theme } from '../utils/theme';

export default function CadastroUsuarioScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuthData = useUserStore((state) => state.setAuthData);

  const emailValido = email.trim().includes('@') && email.trim().includes('.');
  const senhaValida = senha.length >= 6;
  const senhasIguais = senha === confirmarSenha && confirmarSenha.length > 0;
  const canSubmit = nome.trim() && emailValido && senhaValida && senhasIguais;

  async function cadastrar() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        password: senha,
        tipo_usuario: 'cliente',
      });

      const usuario = response?.data?.user || response?.data?.usuario || response?.data;
      const token =
        response?.data?.access_token ||
        response?.data?.token ||
        `local_signup_${Date.now()}`;

      const userData = {
        ...usuario,
        nome: usuario?.nome || nome.trim(),
        email: usuario?.email || email.trim(),
        telefone: usuario?.telefone || telefone.trim(),
      };

      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setAuthData({ token, user: userData });

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const rawMessage = error?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || error?.response?.data?.error || 'Nao foi possivel criar sua conta.';

      Alert.alert('Erro', message);
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>AutoTruck</Text>
          <Text style={styles.subtitle}>Crie sua conta</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />
          </View>

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
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimo 6 caracteres"
                secureTextEntry={!mostrarSenha}
                value={senha}
                onChangeText={setSenha}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarSenha((prev) => !prev)}
                disabled={loading}
              >
                <Ionicons name={mostrarSenha ? 'eye-off' : 'eye'} size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a senha novamente"
              secureTextEntry={!mostrarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            onPress={cadastrar}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLinkText}>Ja tem conta? Entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 28 },
  inputGroup: { marginBottom: 14 },
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
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  eyeButton: { paddingHorizontal: 12, paddingVertical: 10 },
  button: {
    marginTop: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { marginTop: 18, alignItems: 'center' },
  loginLinkText: { color: theme.colors.primary, fontWeight: '700' },
});
