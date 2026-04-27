import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../utils/theme';

/* Adicionamos o { navigation } como parâmetro da função */
export default function VeiculosScreen({ navigation }) {
  return (
    <View style={styles.container}>
<<<<<<< HEAD
      {veiculos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.text}>🚚</Text>
          <Text style={styles.text}>Nenhum veículo cadastrado</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.link}>Cadastrar meu primeiro veículo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={veiculos}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('EditarVeiculo', { vehicle: item })
              }
            >
              <Text style={styles.title}>{item.marca} {item.modelo}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.placa}</Text>
              </View>
              <Text style={styles.info}>{item.ano} • {item.motor}</Text>
            </TouchableOpacity>
          )}
        />
      )}
=======
      <Text style={styles.text}>Meus Veículos</Text>
>>>>>>> c404ef885a592b2223d089f9aa44ebf2937faf13

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