import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { logoutAndRedirectToLogin } from '../services/authSession';
import { perfilService } from '../services/api';
import useUserStore from '../store/userStore';
import { theme } from '../utils/theme';

export default function PerfilScreen({ navigation }) {
  const authenticatedUser = useUserStore((state) => state.user);
  const setAuthData = useUserStore((state) => state.setAuthData);
  const token = useUserStore((state) => state.token);

  const [user, setUser] = useState({
    nome: authenticatedUser?.nome || 'Usuário',
    email: authenticatedUser?.email || '',
    telefone: authenticatedUser?.telefone || '',
    tipo: authenticatedUser?.tipo_usuario || 'cliente',
    criado_em: authenticatedUser?.criado_em || '',
  });

  const [editUser, setEditUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authenticatedUser) {
      const userData = {
        nome: authenticatedUser?.nome || 'Usuário',
        email: authenticatedUser?.email || '',
        telefone: authenticatedUser?.telefone || '',
        tipo: authenticatedUser?.tipo_usuario || 'cliente',
        criado_em: authenticatedUser?.criado_em || '',
      };
      setUser(userData);
      setEditUser(userData);
    }
  }, [authenticatedUser]);

  const isChanged =
    user.nome !== editUser.nome ||
    user.telefone !== editUser.telefone ||
    user.tipo !== editUser.tipo;

  const getInitials = (nome) => {
    const initials = nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return initials || 'U';
  };

  const handleSave = async () => {
    if (!isChanged) return;

    setIsSaving(true);
    try {
      const dadosAtualizacao = {
        nome: editUser.nome,
        telefone: editUser.telefone,
      };

      const response = await perfilService.atualizarPerfil(dadosAtualizacao);
      
      // Atualizar o store com os novos dados
      setAuthData({
        token,
        user: {
          ...authenticatedUser,
          ...response.user,
        }
      });

      setUser(editUser);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logoutAndRedirectToLogin(navigation);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials(editUser.nome)}
        </Text>
      </View>

      <Text style={styles.nome}>{editUser.nome}</Text>
      <Text style={styles.email}>{editUser.email}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{editUser.tipo}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={editUser.nome}
        onChangeText={(text) =>
          setEditUser({ ...editUser, nome: text })
        }
        placeholder="Nome"
        editable={!isSaving}
      />

      <TextInput
        style={styles.input}
        value={editUser.telefone}
        onChangeText={(text) =>
          setEditUser({ ...editUser, telefone: text })
        }
        placeholder="Telefone"
        editable={!isSaving}
      />

      {isChanged && (
        <TouchableOpacity 
          style={[styles.button, isSaving && { opacity: 0.6 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>
      )}

      {user.criado_em ? (
        <Text style={styles.data}>
          Membro desde {user.criado_em}
        </Text>
      ) : null}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
        <Text style={styles.logoutButtonText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  nome: {
    fontSize: 20,
    color: theme.colors.text || '#000',
    fontWeight: '600',
  },
  email: {
    color: 'gray',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#E5E7EB',
    padding: 6,
    borderRadius: 10,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    color: '#000',
  },
  button: {
    backgroundColor: 'orange',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  data: {
    marginTop: 20,
    color: 'gray',
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 24,
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
});
