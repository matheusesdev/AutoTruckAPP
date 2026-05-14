import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import NotificacaoContainer from './src/components/NotificacaoContainer';
import { ToastProvider } from './src/utils';

export default function App() {
  return (
    <ToastProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      <NotificacaoContainer />
    </ToastProvider>
  );
}