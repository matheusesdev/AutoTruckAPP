import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // Usando os ícones do Expo

// Telas Placeholder que criamos (Verifique se elas existem na pasta src/screens/)
import CadastroScreen from '../screens/CadastroScreen';
import HomeScreen from '../screens/HomeScreen';
import PecasScreen from '../screens/PecasScreen';
import VeiculosScreen from '../screens/VeiculosScreen';
import ServicosScreen from '../screens/ServicosScreen';
import PerfilScreen from '../screens/PerfilScreen';

import theme from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navegação das 5 Abas (Bottom Tabs)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Peças') iconName = focused ? 'build' : 'build-outline';
          else if (route.name === 'Veículos') iconName = focused ? 'bus' : 'bus-outline';
          else if (route.name === 'Serviços') iconName = focused ? 'construct' : 'construct-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent, // Laranja
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Esconde o cabeçalho padrão de cada aba
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Peças" component={PecasScreen} />
      <Tab.Screen name="Veículos" component={VeiculosScreen} />
      <Tab.Screen name="Serviços" component={ServicosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Navegação Principal (Stack Navigator) que engloba o Menu e outras telas independentes (como Cadastro)
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Cadastro">
        
        {/* Tela de Cadastro */}
        <Stack.Screen 
          name="Cadastro" 
          component={CadastroScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Telas logadas do Menu Base */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} // Esconde o cabeçalho do stack para mostrar só as abas
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}