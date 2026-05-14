import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const ScreenHeader = ({ title, subtitle, onBack, rightAction, gradient = false }) => {
  const HeaderContent = () => (
    <View style={styles.headerContent}>
      {onBack ? (
        <TouchableOpacity style={styles.sideButton} onPress={onBack} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}

      <View style={styles.titleContainer}>
        <Text style={[styles.title, theme.typography.h3]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, theme.typography.caption]}>{subtitle}</Text> : null}
      </View>

      {rightAction ? (
        <TouchableOpacity
          style={styles.sideButton}
          onPress={rightAction.onPress}
          accessibilityLabel={rightAction.label ?? 'Ação'}
        >
          <Ionicons name={rightAction.icon} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {gradient ? (
        <LinearGradient colors={['#FF9500', '#FF6000']} style={styles.header}>
          <HeaderContent />
        </LinearGradient>
      ) : (
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}> 
          <HeaderContent />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 0,
  },
  header: {
    height: 56,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flex: 1,
  },
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ScreenHeader;
