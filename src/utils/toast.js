// src/utils/toast.js
// Exemplo de uso:
// import { ToastProvider, showToast } from '../utils/toast';
//
// <ToastProvider>
//   <AppNavigator />
// </ToastProvider>
//
// showToast('Operação finalizada', 'success');
// showToast('Algo deu errado', 'error', 5000);

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

const ToastContext = createContext();
let toastController = null;

const ToastNotification = ({ message, type, duration, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        onHide?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onHide, opacity, translateY]);

  const toastStyle = (() => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#1C3A2A',
          icon: 'checkmark-circle',
          textColor: theme.colors.success,
        };
      case 'error':
        return {
          backgroundColor: '#3A1C1C',
          icon: 'close-circle',
          textColor: '#FF453A',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#1C2A3A',
          icon: 'information-circle',
          textColor: theme.colors.info,
        };
    }
  })();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: toastStyle.backgroundColor,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <Ionicons name={toastStyle.icon} size={20} color={toastStyle.textColor} style={styles.icon} />
        <Text style={[styles.message, { color: toastStyle.textColor }]}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
  };

  const hideToast = () => setToast(null);

  useEffect(() => {
    toastController = { showToast };
    return () => {
      toastController = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
      ) : null}
    </ToastContext.Provider>
  );
};

export const showToast = (message, type = 'info', duration = 3000) => {
  if (toastController?.showToast) {
    toastController.showToast(message, type, duration);
  } else {
    console.warn('ToastProvider não está montado. Adicione <ToastProvider> no root.');
  }
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
