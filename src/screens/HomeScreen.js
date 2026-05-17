// src/screens/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <Text style={styles.title}>Painel Principal</Text>
      <Text style={styles.subtitle}>Encontre cargas e gerencie seu caminhão</Text>

      {/* TODO: aplicar layout UI-06 no painel principal */}

      {/* Botão de Emergência */}
      <TouchableOpacity
        style={styles.botaoEmergencia}
        onPress={() => navigation.navigate('Emergencia')}
        activeOpacity={0.85}
      >
        <Ionicons name="warning" size={28} color="#FFFFFF" />
        <View style={styles.botaoTextoContainer}>
          <Text style={styles.botaoTitulo}>EMERGÊNCIA</Text>
          <Text style={styles.botaoSubtitulo}>Solicitar atendimento imediato</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: theme.spacing.xl,
  },
  botaoEmergencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    gap: theme.spacing.md,
    ...theme.shadow.lg,
  },
  botaoTextoContainer: {
    flex: 1,
  },
  botaoTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  botaoSubtitulo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});