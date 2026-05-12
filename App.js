import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import NotificacaoContainer from './src/components/NotificacaoContainer';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
      <NotificacaoContainer />
    </>
  );
}