import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const animValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.stagger(
      90,
      animValues.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 420,
          delay: i * 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const emailValido = (value = email) => value.trim().includes('@') && value.trim().includes('.');
  const senhaValida = (s = senha) => s.length >= 6;
  const senhasIguais = () => senha === confirmarSenha && confirmarSenha.length > 0;
  const telefonePreenchido = () => telefone.trim().length > 0;
  const canSubmit =
    nome.trim().length > 0 &&
    emailValido() &&
    telefonePreenchido() &&
    senhaValida() &&
    senhasIguais();

  const validateField = (field, value) => {
    let message = '';
    if (field === 'email') message = emailValido(value) ? '' : 'Informe um e-mail válido';
    if (field === 'nome') message = value.trim().length > 0 ? '' : 'Preencha seu nome completo';
    if (field === 'telefone') message = value.replace(/\D/g, '').length >= 10 ? '' : 'Informe um telefone válido';
    if (field === 'senha') message = senhaValida(value) ? '' : 'A senha deve ter no mínimo 6 caracteres';
    if (field === 'confirmarSenha') message = value === senha ? '' : 'As senhas devem ser iguais';
    setFieldErrors((s) => ({ ...s, [field]: message }));
    return message === '';
  };

  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const passwordStrength = (s = senha) => {
    if (!s) return 0;
    let score = 0;
    if (s.length >= 6) score++;
    if (/[A-Z]/.test(s) && /[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s) && s.length >= 8) score++;
    return score; // 0..3
  };

  async function cadastrar() {
    setServerError('');
    if (loading) return;

    const checks = [
      validateField('nome', nome),
      validateField('email', email),
      validateField('telefone', telefone),
      validateField('senha', senha),
      validateField('confirmarSenha', confirmarSenha),
    ];
    if (checks.some((c) => !c)) return;

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

      try {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } catch (navErr) {
        console.error('Navigation reset failed', navErr);
        setServerError('Conta criada, mas houve um erro ao abrir a tela principal. Reinicie o app.');
      }
    } catch (error) {
      const rawMessage = error?.response?.data?.message;
      const isNetworkError = !!error?.request && !error?.response;
      const apiBase = api?.defaults?.baseURL;
      const message = isNetworkError
        ? `Não foi possível conectar ao servidor. Verifique sua internet e se a API está acessível na mesma rede.\n\nAPI: ${apiBase || 'não definida'}`
        : Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || error?.response?.data?.error || 'Não foi possível criar sua conta.';

      setServerError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[theme.colors.primaryAlpha10, theme.colors.background]} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Animated.View style={{ opacity: animValues[0], transform: [{ translateY: animValues[0].interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }}>
              <Text style={styles.logo}>AutoTruck</Text>
              <Text style={styles.subtitle}>Crie sua conta</Text>
            </Animated.View>

            <Animated.View style={{ opacity: animValues[1], transform: [{ translateY: animValues[1].interpolate({ inputRange: [0,1], outputRange: [12,0] }) }], marginTop: 8 }}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput style={styles.input} placeholder="Digite seu nome" value={nome} onChangeText={(v) => { setNome(v); validateField('nome', v); }} editable={!loading} />
              {fieldErrors.nome ? <Text style={styles.fieldError}>{fieldErrors.nome}</Text> : null}
            </Animated.View>

            <Animated.View style={{ opacity: animValues[2], transform: [{ translateY: animValues[2].interpolate({ inputRange: [0,1], outputRange: [12,0] }) }], marginTop: 12 }}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput style={styles.input} placeholder="Digite seu e-mail" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={(v) => { setEmail(v); validateField('email', v); }} editable={!loading} />
              {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}

              <Text style={[styles.label, { marginTop: 12 }]}>Telefone</Text>
              <TextInput style={styles.input} placeholder="(XX) XXXXX-XXXX" keyboardType="phone-pad" value={telefone} onChangeText={(v) => { const f = formatPhone(v); setTelefone(f); validateField('telefone', f); }} editable={!loading} />
              {fieldErrors.telefone ? <Text style={styles.fieldError}>{fieldErrors.telefone}</Text> : null}
            </Animated.View>

            <Animated.View style={{ opacity: animValues[3], transform: [{ translateY: animValues[3].interpolate({ inputRange: [0,1], outputRange: [12,0] }) }], marginTop: 12 }}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} placeholder="Mínimo de 6 caracteres" secureTextEntry={!mostrarSenha} value={senha} onChangeText={(v) => { setSenha(v); validateField('senha', v); }} editable={!loading} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setMostrarSenha((prev) => !prev)} disabled={loading}>
                  <Ionicons name={mostrarSenha ? 'eye-off' : 'eye'} size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {fieldErrors.senha ? <Text style={styles.fieldError}>{fieldErrors.senha}</Text> : null}

              <View style={styles.strengthRow}>
                {[0,1,2].map((i) => (
                  <View key={i} style={[styles.strengthSegment, { backgroundColor: i < passwordStrength() ? (i === 0 ? theme.colors.error : i === 1 ? theme.colors.warning : theme.colors.success) : theme.colors.disabled }]} />
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Confirmar senha</Text>
              <TextInput style={styles.input} placeholder="Digite a senha novamente" secureTextEntry={!mostrarSenha} value={confirmarSenha} onChangeText={(v) => { setConfirmarSenha(v); validateField('confirmarSenha', v); }} editable={!loading} />
              {fieldErrors.confirmarSenha ? <Text style={styles.fieldError}>{fieldErrors.confirmarSenha}</Text> : null}
            </Animated.View>

            {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

            <TouchableOpacity style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]} onPress={cadastrar} disabled={!canSubmit || loading}>
              {loading ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.buttonText}>Criar conta</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLinkText}>Já tem conta? Entrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
