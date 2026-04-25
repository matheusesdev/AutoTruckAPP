// src/screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel Principal</Text>
      <Text style={styles.subtitle}>Encontre cargas e gerencie seu caminhão</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 10
  }
});