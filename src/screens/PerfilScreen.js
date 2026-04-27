import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { theme } from '../utils/theme';

export default function PerfilScreen() {

  const [user, setUser] = useState({
    nome: "João Silva",
    email: "joao@email.com",
    telefone: "(77) 99999-9999",
    tipo: "Caminhoneiro Autônomo",
    criado_em: "2024-01-10"
  });

  const [editUser, setEditUser] = useState(user);

  const isChanged =
    user.nome !== editUser.nome ||
    user.telefone !== editUser.telefone ||
    user.tipo !== editUser.tipo;

  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSave = () => {
    setUser(editUser);
    Alert.alert("Sucesso", "Dados atualizados!");
  };

  return (
    <View style={styles.container}>

      {/* AVATAR */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials(editUser.nome)}
        </Text>
      </View>

      {/* NOME E EMAIL */}
      <Text style={styles.nome}>{editUser.nome}</Text>
      <Text style={styles.email}>{editUser.email}</Text>

      {/* BADGE */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{editUser.tipo}</Text>
      </View>

      {/* CAMPOS */}
      <TextInput
        style={styles.input}
        value={editUser.nome}
        onChangeText={(text) =>
          setEditUser({ ...editUser, nome: text })
        }
        placeholder="Nome"
      />

      <TextInput
        style={styles.input}
        value={editUser.telefone}
        onChangeText={(text) =>
          setEditUser({ ...editUser, telefone: text })
        }
        placeholder="Telefone"
      />

      {/* BOTÃO SALVAR */}
      {isChanged && (
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar alterações</Text>
        </TouchableOpacity>
      )}

      {/* DATA */}
      <Text style={styles.data}>
        Membro desde {user.criado_em}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.background
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  email: {
    color: 'gray',
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#E5E7EB',
    padding: 6,
    borderRadius: 10,
    marginBottom: 20
  },
  badgeText: {
    fontSize: 12
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  button: {
    backgroundColor: 'orange',
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  data: {
    marginTop: 20,
    color: 'gray'
  }
});