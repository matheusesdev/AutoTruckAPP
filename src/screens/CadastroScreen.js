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
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { theme } from '../utils/theme';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (val) => {
    let cleanText = val.replace(/\D/g, '');
    if (cleanText.length > 2 && cleanText.length <= 7) {
      cleanText = `(${cleanText.substring(0, 2)}) ${cleanText.substring(2)}`;
    } else if (cleanText.length > 7) {
      cleanText = `(${cleanText.substring(0, 2)}) ${cleanText.substring(2, 7)}-${cleanText.substring(7, 11)}`;
    }
    setTelefone(cleanText);
  };

  const isEmailValid = email.includes('@') && email.includes('.');
  const isTelefoneValid = telefone.length >= 14;
  const isSenhaValid = senha.length >= 6;
  const isSenhasIguais = senha === confirmarSenha && senha !== '';
  const isFormValid = nome && isEmailValid && isTelefoneValid && isSenhaValid && isSenhasIguais && tipoUsuario;

  const handleCadastrar = async () => {
    if (!isFormValid || loading) return;

    try {
      setLoading(true);

      await api.post('/auth/register', {
        nome: nome.trim(),
        email: email.trim(),
        telefone,
        password: senha,
        tipo_usuario: tipoUsuario,
      });

      Alert.alert('Sucesso', 'Conta criada. Faça login para continuar.');
      navigation.replace('Login');
    } catch (error) {
      console.error(error);

      const rawMessage = error?.response?.data?.message;

      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || error?.response?.data?.error || error?.message || 'Erro ao salvar informações.';

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
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.logo}>AutoTruck</Text>
          <Text style={styles.subtitle}>Crie sua conta no app</Text>

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome completo"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {email.length > 0 && !isEmailValid && <Text style={styles.errorText}>E-mail requer "@" e "."</Text>}
          </View>

          {/* Telefone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone Celular:</Text>
            <TextInput
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
              keyboardType="phone-pad"
              maxLength={15}
              value={telefone}
              onChangeText={formatPhone}
            />
            {telefone.length > 0 && !isTelefoneValid && <Text style={styles.errorText}>Telefone incompleto.</Text>}
          </View>

          {/* Perfil */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Perfil de Usuário:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tipoUsuario}
                onValueChange={(itemValue) => setTipoUsuario(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Selecione seu perfil" value="" color="#999" />
                <Picker.Item label="Caminhoneiro Autônomo" value="Caminhoneiro Autônomo" />
                <Picker.Item label="Empresa de Transporte" value="Empresa de Transporte" />
                <Picker.Item label="Empresa de Ônibus" value="Empresa de Ônibus" />
                <Picker.Item label="Gestor de Frota" value="Gestor de Frota" />
              </Picker>
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha de Acesso:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite sua senha (mínimo 6 dígitos)"
                secureTextEntry={!mostrarSenha}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.eyeIcon}>
                <Ionicons name={mostrarSenha ? "eye-off" : "eye"} size={22} color="#999" />
              </TouchableOpacity>
            </View>
            {senha.length > 0 && !isSenhaValid && <Text style={styles.errorText}>A senha requer no mínimo 6 caracteres.</Text>}
          </View>

          {/* Confirmar Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Senha:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirme sua senha"
                secureTextEntry={!mostrarSenha}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
            </View>
            {confirmarSenha.length > 0 && !isSenhasIguais && <Text style={styles.errorText}>As senhas digitadas não batem.</Text>}
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity 
            style={[styles.button, isFormValid ? styles.buttonActive : styles.buttonDisabled]}
            disabled={!isFormValid || loading}
            onPress={handleCadastrar}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>CADASTRAR</Text>
            )}
          </TouchableOpacity>

          {/* Entrar */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Já tem conta? <Text style={styles.loginLinkBold}>Entrar</Text></Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  scrollContainer: { padding: 24, paddingBottom: 50 },
  logo: { fontSize: 36, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center', marginTop: Platform.OS === 'ios' ? 10 : 30 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, marginTop: 5 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 6, marginLeft: 2 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 12, padding: 16, fontSize: 15, color: theme.colors.text
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 12, overflow: 'hidden'
  },
  picker: { 
    height: Platform.OS === 'ios' ? 140 : 54, // Restringe crescimento infinito no iOS
    width: '100%',
    justifyContent: 'center'
  },
  pickerItem: { fontSize: 15, height: 140 }, // Garante que a roda do iOS fique do tamanho certo no iPhone 
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 15, color: theme.colors.text },
  eyeIcon: { padding: 15 },
  errorText: { color: theme.colors.error, fontSize: 11, marginTop: 4, marginLeft: 2, fontWeight: '500' },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, height: 54, justifyContent: 'center' },
  buttonActive: {
    backgroundColor: theme.colors.accent,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)' }
      : {
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }),
  },
  buttonDisabled: { backgroundColor: '#CBD5E1' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { color: '#666', fontSize: 14 },
  loginLinkBold: { color: theme.colors.primary, fontWeight: 'bold' }
});