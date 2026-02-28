import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../theme/colors';

interface StatusIndicatorProps {
  status: 'active' | 'protected' | 'warning' | 'alert' | 'partial' | 'blocked' | 'inactive';
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function StatusIndicator({ status, label, size = 'medium' }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
      case 'protected':
        return colors.status.active;
      case 'warning':
      case 'partial':
        return colors.status.warning;
      case 'alert':
        return colors.status.alert;
      case 'blocked':
      case 'inactive':
        return colors.neutral.text.muted;
      default:
        return colors.neutral.text.muted;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { dot: 6, text: 11 };
      case 'large':
        return { dot: 12, text: 15 };
      default:
        return { dot: 8, text: 13 };
    }
  };

  const sizes = getSize();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: sizes.dot,
            height: sizes.dot,
            borderRadius: sizes.dot / 2,
            backgroundColor: getStatusColor(),
          },
        ]}
      />
      {label && (
        <Text style={[styles.label, { fontSize: sizes.text, color: getStatusColor() }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
