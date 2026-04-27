import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import CadastroScreen from '../screens/CadastroScreen';
import HomeScreen from '../screens/HomeScreen';
import PecasScreen from '../screens/PecasScreen';
import VeiculosScreen from '../screens/VeiculosScreen';
import ServicosScreen from '../screens/ServicosScreen';
import PerfilScreen from '../screens/PerfilScreen';

// NOVOS IMPORTS: Telas que você criou para o Agendamento e Cancelamento
import AgendarServicoScreen from '../screens/AgendarServicoScreen';
import DetalheServicoScreen from '../screens/DetalheServicoScreen';
import { navigationRef } from './navigationService';
import DetalhePecasScreen from '../screens/DetalhePecasScreen';
import OrcamentosScreen from '../screens/OrcamentosScreen';
import SolicitarOrcamentoScreen from '../screens/SolicitarOrcamentoScreen';

import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Peças" component={PecasScreen} />
      <Tab.Screen name="Veículos" component={VeiculosScreen} />
      <Tab.Screen name="Serviços" component={ServicosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
      <Tab.Screen name="Orçamentos" component={OrcamentosScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('access_token');
        const savedUserData = await AsyncStorage.getItem('user_data');
        const hasValidSession =
          Boolean(savedToken) &&
          Boolean(savedUserData) &&
          !String(savedToken).startsWith('temp_token_');

        if (!hasValidSession && (savedToken || savedUserData)) {
          await AsyncStorage.multiRemove(['access_token', 'user_data']);
        }
        setInitialRoute(hasValidSession ? 'MainTabs' : 'Login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSavedSession();
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Cadastro" 
          component={CadastroScreen} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />

        {/* PASSO 1: Registro das novas telas de Agendamento e Detalhes */}
        <Stack.Screen 
          name="Agendar" 
          component={AgendarServicoScreen} 
          options={{ title: 'Novo Agendamento', headerTintColor: theme.colors.primary }} 
        />

        <Stack.Screen 
          name="DetalheServico" 
          component={DetalheServicoScreen} 
          options={{ title: 'Detalhes do Serviço', headerTintColor: theme.colors.primary }} 
        />

        {/* Detalhe de Peça */}
        <Stack.Screen
          name="DetalhePecas"
          component={DetalhePecasScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
  name="SolicitarOrcamento"
  component={SolicitarOrcamentoScreen}
  options={{ headerShown: false }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}