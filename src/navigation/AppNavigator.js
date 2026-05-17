import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import CadastroUsuarioScreen from '../screens/CadastroUsuarioScreen';
import CadastroVeiculoScreen from '../screens/CadastroVeiculoScreen';
import EsqueciSenhaScreen from '../screens/EsqueciSenhaScreen';
import NovaSenhaScreen from '../screens/NovaSenhaScreen';
import HomeScreen from '../screens/HomeScreen';
import PecasScreen from '../screens/PecasScreen';
import VeiculosScreen from '../screens/VeiculosScreen';
import ServicosScreen from '../screens/ServicosScreen';
import PerfilScreen from '../screens/PerfilScreen';
import EmergenciaScreen from '../screens/EmergenciaScreen';

// Telas de agendamento, detalhes e fluxos complementares.
import AgendarServicoScreen from '../screens/AgendarServicoScreen';
import DetalheServicoScreen from '../screens/DetalheServicoScreen';
import EditarAgendamentoScreen from '../screens/EditarAgendamentoScreen';
import { navigationRef } from './navigationService';
import DetalhePecasScreen from '../screens/DetalhePecasScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ResultadoVinScreen from '../screens/ResultadoVinScreen';
import EditarVeiculoScreen from '../screens/EditarVeiculoScreen';
import OrcamentosScreen from '../screens/OrcamentosScreen';
import SolicitarOrcamentoScreen from '../screens/SolicitarOrcamentoScreen';
import PedidosScreen from '../screens/PedidosScreen';
import DetalhesPedidoScreen from '../screens/DetalhesPedidoScreen';
import NotificacoesScreen from '../screens/NotificacoesScreen';

import { theme } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const linking = {
  prefixes: ['autotruck://', 'autotruck:///', 'http://localhost:8081', 'http://127.0.0.1:8081'],
  config: {
    screens: {
      ResetSenha: 'reset-password',
    },
  },
};

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
          else if (route.name === 'Pedidos') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'Notificações') iconName = focused ? 'notifications' : 'notifications-outline';
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
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Notificações" component={NotificacoesScreen} />
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
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Cadastro" 
          component={CadastroUsuarioScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="EsqueciSenha" 
          component={EsqueciSenhaScreen} 
          options={{ title: 'Recuperar senha', headerTintColor: theme.colors.primary }} 
        />

        <Stack.Screen
          name="ResetSenha"
          component={NovaSenhaScreen}
          options={{ title: 'Nova senha', headerTintColor: theme.colors.primary }}
        />

        <Stack.Screen 
          name="CadastroVeiculo" 
          component={CadastroVeiculoScreen} 
          options={{ title: 'Cadastrar veículo', headerTintColor: theme.colors.primary }} 
        />
        
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />

        {/* Registro das telas de agendamento e detalhes. */}
        <Stack.Screen 
          name="Agendar" 
          component={AgendarServicoScreen} 
          options={{ title: 'Novo Agendamento', headerTintColor: theme.colors.primary }} 
        />

        <Stack.Screen 
          name="DetalheServico" 
          component={DetalheServicoScreen} 
          options={{ title: 'Detalhes do serviço', headerTintColor: theme.colors.primary }} 
        />

        <Stack.Screen 
          name="EditarAgendamento" 
          component={EditarAgendamentoScreen} 
          options={{ title: 'Reagendar Serviço', headerTintColor: theme.colors.primary }} 
        />

        {/* Detalhe de peça */}
        <Stack.Screen
          name="DetalhePeca"
          component={DetalhePecasScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DetalhePecas"
          component={DetalhePecasScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ResultadoVin"
          component={ResultadoVinScreen}
          options={{ title: 'Peças por VIN', headerTintColor: theme.colors.primary }}
        />

        <Stack.Screen
          name="EditarVeiculo"
          component={EditarVeiculoScreen}
          options={{ title: 'Editar veículo', headerTintColor: theme.colors.primary }}
        />

        <Stack.Screen
          name="SolicitarOrcamento"
          component={SolicitarOrcamentoScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DetalhesPedido"
          component={DetalhesPedidoScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Emergencia"
          component={EmergenciaScreen}
          options={{ title: 'Atendimento Emergencial', headerTintColor: theme.colors.error }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
