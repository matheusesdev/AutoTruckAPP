import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export default function VeiculosScreen() {
  return (
    <View style={styles.container}><Text style={styles.text}>Meus Veículos</Text></View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  text: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary }
});