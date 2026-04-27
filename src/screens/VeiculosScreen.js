import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../utils/theme';

/* Adicionamos o { navigation } como parâmetro da função */
export default function VeiculosScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Meus Veículos</Text>

      {/* Botão de Agendar */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Agendar')}
      >
        <Text style={styles.buttonText}>Agendar Novo Serviço</Text>
      </TouchableOpacity> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.background 
  },
  text: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: theme.colors.primary,
    marginBottom: 20 /* Espaço para o botão não ficar colado */
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 2 /* Sombra leve no Android */
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});