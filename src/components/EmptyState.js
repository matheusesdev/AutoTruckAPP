import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const isEmoji = (value) => {
  return typeof value === 'string' && /\p{Extended_Pictographic}/u.test(value);
};

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => {
  const renderIcon = () => {
    if (isEmoji(icon)) {
      return <Text style={styles.emoji}>{icon}</Text>;
    }
    return <Ionicons name={icon} size={56} color={theme.colors.primary} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>{renderIcon()}</View>
      <Text style={[styles.title, theme.typography.h3]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, theme.typography.body]}>{subtitle}</Text> : null}
      {actionLabel ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={[styles.buttonLabel, theme.typography.label]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primaryAlpha10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.disabledText,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  buttonLabel: {
    color: '#000',
    textAlign: 'center',
  },
});

export default EmptyState;
