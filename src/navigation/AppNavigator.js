// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // Ícones inclusos no Expo
import { theme } from '../utils/theme';

// Importando nossas telas
import HomeScreen from '../screens/HomeScreen';
import PecasScreen from '../screens/PecasScreen';
import VeiculosScreen from '../screens/VeiculosScreen';
import ServicosScreen from '../screens/ServicosScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Configurando as abas (Menu Inferior)
function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.primary }, // Cabeçalho azul
        headerTintColor: theme.colors.background, // Texto do cabeçalho banco
        tabBarActiveTintColor: theme.colors.accent, // Laranja p/ menu ativo
        tabBarInactiveTintColor: theme.colors.inactiveText, // Cinza inativo
        tabBarStyle: { 
          backgroundColor: theme.colors.background,
          paddingBottom: 5,
          height: 60
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Peças') iconName = focused ? 'construct' : 'construct-outline';
          else if (route.name === 'Veículos') iconName = focused ? 'bus' : 'bus-outline'; // Usando bus p/ veículos pesados
          else if (route.name === 'Serviços') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Peças" component={PecasScreen} />
      <Tab.Screen name="Veículos" component={VeiculosScreen} />
      <Tab.Screen name="Serviços" component={ServicosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Configurando a Stack que permite navegar de 'por cima' das abas no futuro
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Renderiza as rotas com Abas como o motor principal */}
        <Stack.Screen name="MainTabs" component={TabRoutes} />
        {/* Aqui você poderá adicionar telas q ficam sem o menu inferior depois. Ex: Tela de Login */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}